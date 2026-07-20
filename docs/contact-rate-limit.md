# Contact form rate limiting

`web/send-mail.php` throttles submissions per client IP using a JSON counter
file under `sys_get_temp_dir()/morgado-contact-ratelimit/`, guarded with
`flock()`.

## Known limitation

The counter file lives on the filesystem of the PHP process handling the
request. If the site is ever served from more than one PHP-FPM pool or
server (for example, behind a load balancer with multiple app nodes), each
node keeps its own counter, so the effective limit becomes
`maxRequests × number of nodes` instead of the configured `5 per 15 minutes`.

This is not a concern on a single cPanel account with one PHP process pool,
which is the current deployment target. If the site ever moves to a
multi-node deployment, replace the file-based counter with a shared store
(for example Redis or the database) before relying on this limit.
