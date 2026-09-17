<?php
declare(strict_types=1);

/**
 * iLoveMyFile shared application helpers.
 * Safe foundation: this file is not required by the current homepage until
 * index.php is migrated to the shared architecture.
 */

if (!function_exists('ilmf_e')) {
    function ilmF_e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('ilmF_url')) {
    function ilmF_url(string $path = '/'): string
    {
        if ($path === '') {
            return '/';
        }

        if ($path[0] !== '/') {
            $path = '/' . $path;
        }

        return $path === '/' ? '/' : rtrim($path, '/');
    }
}

if (!function_exists('ilmF_abs_url')) {
    function ilmF_abs_url(string $path = '/'): string
    {
        return 'https://ilovemyfile.com' . ilmF_url($path);
    }
}

if (!function_exists('ilmF_current_path')) {
    function ilmF_current_path(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $path = is_string($path) && $path !== '' ? $path : '/';
        return '/' . trim($path, '/');
    }
}

if (!function_exists('ilmF_asset')) {
    function ilmF_asset(string $path): string
    {
        $path = ltrim($path, '/');
        return '/' . $path;
    }
}

if (!function_exists('ilmF_is_active')) {
    function ilmF_is_active(string $path, string $currentPath): bool
    {
        $path = ilmF_url($path);
        $currentPath = ilmF_url($currentPath);

        if ($path === '/') {
            return $currentPath === '/';
        }

        return $currentPath === $path || str_starts_with($currentPath, $path . '/');
    }
}

if (!function_exists('ilmF_theme')) {
    function ilmF_theme(): string
    {
        return 'light';
    }
}

if (!function_exists('ilmF_json')) {
    function ilmF_json(array $data): string
    {
        return json_encode(
            $data,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        ) ?: '{}';
    }
}

if (!function_exists('ilmF_normalize_slug')) {
    function ilmF_normalize_slug(string $slug): string
    {
        $slug = strtolower(trim($slug));
        $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug) ?? '';
        return trim($slug, '-');
    }
}
