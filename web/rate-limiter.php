<?php

declare(strict_types=1);

/**
 * Limita las solicitudes por IP para mitigar spam, flood o sondeo repetido:
 * como no hay backend con base de datos, se guarda un contador por IP en un
 * archivo del directorio temporal del sistema (fuera del webroot, no
 * accesible por HTTP), protegido con flock() para uso concurrente seguro.
 * $namespace separa el almacenamiento entre distintos consumidores (por
 * ejemplo, el formulario de contacto y el endpoint de salud) para que no
 * compartan el mismo contador.
 */
/**
 * Opportunistically deletes rate-limit files whose contents can only be
 * stale: if a file hasn't been written in $windowSeconds, every timestamp
 * inside it has already aged out of the window on the next read anyway.
 * Runs on a small fraction of requests so it doesn't add I/O to every call
 * under normal traffic, since nothing else prunes this directory.
 */
function pruneStaleRateLimitFiles(string $dir, int $windowSeconds): void
{
    $entries = @scandir($dir);
    if ($entries === false) {
        return;
    }

    $cutoff = time() - $windowSeconds;
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..' || !str_ends_with($entry, '.json')) {
            continue;
        }

        $path = $dir . '/' . $entry;
        $mtime = @filemtime($path);
        if ($mtime !== false && $mtime < $cutoff) {
            @unlink($path);
        }
    }
}

function checkRateLimit(
    string $ip,
    int $maxRequests,
    int $windowSeconds,
    int $minSecondsBetween,
    string $namespace = 'morgado-contact-ratelimit'
): ?bool {
    $dir = sys_get_temp_dir() . '/' . $namespace;
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        return null;
    }

    if (random_int(1, 100) === 1) {
        pruneStaleRateLimitFiles($dir, $windowSeconds);
    }

    $file = $dir . '/' . hash('sha256', $ip) . '.json';
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        return null;
    }

    if (!flock($handle, LOCK_EX | LOCK_NB)) {
        fclose($handle);
        return null;
    }

    $raw = stream_get_contents($handle);
    if ($raw === false) {
        flock($handle, LOCK_UN);
        fclose($handle);
        return null;
    }

    $timestamps = [];
    if ($raw !== '') {
        $data = json_decode($raw, true);
        if (
            !is_array($data)
            || !array_key_exists('timestamps', $data)
            || !is_array($data['timestamps'])
        ) {
            flock($handle, LOCK_UN);
            fclose($handle);
            return null;
        }

        $timestamps = $data['timestamps'];
    }

    $now = time();
    $timestamps = array_values(array_filter(
        $timestamps,
        static fn ($t) => is_int($t) && $t > $now - $windowSeconds
    ));

    $allowed = true;
    if (count($timestamps) >= $maxRequests) {
        $allowed = false;
    } elseif ($timestamps !== [] && $now - max($timestamps) < $minSecondsBetween) {
        $allowed = false;
    }

    if ($allowed) {
        $timestamps[] = $now;
        $encoded = json_encode(['timestamps' => $timestamps]);
        if ($encoded === false || !ftruncate($handle, 0) || !rewind($handle)) {
            flock($handle, LOCK_UN);
            fclose($handle);
            return null;
        }

        $written = fwrite($handle, $encoded);
        if ($written === false || $written !== strlen($encoded) || !fflush($handle)) {
            flock($handle, LOCK_UN);
            fclose($handle);
            return null;
        }
    }

    flock($handle, LOCK_UN);
    fclose($handle);

    return $allowed;
}
