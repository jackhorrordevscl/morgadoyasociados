<?php

declare(strict_types=1);

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';
require_once __DIR__ . '/mail-config-loader.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

const MAX_NAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 40;
const MAX_SUBJECT_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 5000;

header('Content-Type: application/json; charset=UTF-8');

function respond(int $status, bool $success, string $message = ''): void
{
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Registra únicamente códigos operativos: nunca datos enviados por el cliente,
 * direcciones de correo ni valores de la configuración SMTP.
 */
function logMailEvent(string $event): void
{
    error_log('contact_mail event=' . $event);
}

function requiredExtensionsAvailable(): bool
{
    $missing = [];
    foreach (['mbstring', 'openssl'] as $extension) {
        if (!extension_loaded($extension)) {
            $missing[] = $extension;
        }
    }

    if ($missing === []) {
        return true;
    }

    logMailEvent('dependency_unavailable dependency=' . implode(',', $missing));
    return false;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Método no permitido.');
}

/**
 * Limita los envíos por IP para evitar que el formulario se use para spam o
 * flood: como no hay backend con base de datos, se guarda un contador por IP
 * en un archivo del directorio temporal del sistema (fuera del webroot, no
 * accesible por HTTP), protegido con flock() para uso concurrente seguro.
 */
function checkRateLimit(string $ip, int $maxRequests, int $windowSeconds, int $minSecondsBetween): bool
{
    $dir = sys_get_temp_dir() . '/morgado-contact-ratelimit';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        return true; // si no se puede llevar el conteo, no bloqueamos el envío
    }

    $file = $dir . '/' . hash('sha256', $ip) . '.json';
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        return true;
    }

    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        return true;
    }

    $raw = stream_get_contents($handle);
    $data = $raw !== false && $raw !== '' ? json_decode($raw, true) : null;
    $timestamps = is_array($data['timestamps'] ?? null) ? $data['timestamps'] : [];

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
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode(['timestamps' => $timestamps]));
        fflush($handle);
    }

    flock($handle, LOCK_UN);
    fclose($handle);

    return $allowed;
}

$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!checkRateLimit($clientIp, maxRequests: 5, windowSeconds: 900, minSecondsBetween: 15)) {
    respond(429, false, 'Ha enviado demasiadas solicitudes. Por favor intente nuevamente en unos minutos.');
}

// Honeypot: si el campo oculto viene relleno, es un bot. Respondemos éxito
// falso para no delatar el filtro, pero no enviamos nada.
if (!empty($_POST['website'])) {
    respond(200, true);
}

if (($_POST['privacy_consent'] ?? '') !== 'accepted') {
    respond(422, false, 'Debe aceptar la Política de Privacidad para enviar su consulta.');
}

$nombre = trim((string) ($_POST['nombre'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$telefono = trim((string) ($_POST['telefono'] ?? ''));
$area = trim((string) ($_POST['area'] ?? ''));
$mensaje = trim((string) ($_POST['mensaje'] ?? ''));

if ($nombre === '' || $mensaje === '') {
    respond(422, false, 'Por favor complete los campos obligatorios.');
}

if (!requiredExtensionsAvailable()) {
    respond(503, false, 'El servicio de contacto no está disponible. Intente nuevamente más tarde.');
}

if (
    mb_strlen($nombre) > MAX_NAME_LENGTH
    || mb_strlen($email) > MAX_EMAIL_LENGTH
    || mb_strlen($telefono) > MAX_PHONE_LENGTH
    || mb_strlen($area) > MAX_SUBJECT_LENGTH
    || mb_strlen($mensaje) > MAX_MESSAGE_LENGTH
) {
    respond(422, false, 'Uno de los campos supera la longitud permitida.');
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false, 'Por favor ingrese un correo electrónico válido.');
}

$config = loadMailConfig();

if (!hasValidMailConfig($config)) {
    logMailEvent('configuration_unavailable reason=invalid_or_missing');
    respond(503, false, 'El servicio de contacto no está disponible. Intente nuevamente más tarde.');
}

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $smtpConnectionTimeout = 20;
    $mail->Timeout = $smtpConnectionTimeout;
    $mail->Host = $config['smtp_host'];
    $mail->Port = $config['smtp_port'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_user'];
    $mail->Password = $config['smtp_pass'];
    $mail->SMTPSecure = $config['smtp_secure'];
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($config['smtp_user'], 'Formulario web · Morgado, Cía. & Asociados');
    $mail->addAddress($config['to_email'], $config['to_name']);
    $mail->addReplyTo($email, $nombre);

    $mail->Subject = 'Nueva consulta desde el sitio web' . ($area !== '' ? " · {$area}" : '');
    $mail->Body = implode("\n", [
        "Nombre: {$nombre}",
        "Correo: {$email}",
        'Teléfono: ' . ($telefono !== '' ? $telefono : '(no indicado)'),
        'Área de interés: ' . ($area !== '' ? $area : '(no indicada)'),
        '',
        'Mensaje:',
        $mensaje,
    ]);

    $mail->send();
    respond(200, true);
} catch (PHPMailerException) {
    logMailEvent('smtp_delivery_failed');
    respond(503, false, 'No se pudo enviar su consulta. Intente nuevamente más tarde.');
} catch (Throwable) {
    logMailEvent('mail_processing_failed');
    respond(500, false, 'No se pudo enviar su consulta. Intente nuevamente más tarde.');
}
