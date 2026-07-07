const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email wajib diisi.";
  if (!EMAIL_REGEX.test(trimmed)) return "Format email tidak valid.";
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
  if (normalized.includes("password")) {
    return "Password tidak memenuhi persyaratan.";
  }

  return error;
}
