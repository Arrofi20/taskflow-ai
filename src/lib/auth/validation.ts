const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);

  if (!normalized) return "Email wajib diisi.";
  if (normalized.length > 254) return "Email terlalu panjang.";
  if (!EMAIL_REGEX.test(normalized) || normalized.startsWith("@") || normalized.endsWith("@")) {
    return "Format email tidak valid. Contoh: nama@gmail.com";
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password wajib diisi.";
  if (password.length < 6) return "Password minimal 6 karakter.";
  return null;
}

export function validateFullName(fullName: string): string | null {
  const trimmed = fullName.trim();
  if (!trimmed) return "Nama lengkap wajib diisi.";
  if (trimmed.length < 2) return "Nama lengkap minimal 2 karakter.";
  return null;
}

export function getAuthErrorMessage(error: string): string {
  const normalized = error.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email atau password salah.";
  }
  if (normalized.includes("user already registered")) {
    return "Email sudah terdaftar. Silakan login.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email belum diverifikasi. Periksa inbox Anda.";
  }
  if (normalized.includes("email address") && normalized.includes("is invalid")) {
    return "Email tidak diizinkan oleh sistem autentikasi. Periksa konfigurasi provider email di Supabase atau gunakan email lain.";
  }
  if (normalized.includes("password")) {
    return "Password tidak memenuhi persyaratan.";
  }

  return error;
}
