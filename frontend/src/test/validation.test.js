import { describe, it, expect, beforeEach } from 'vitest';

const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const emailPolicy = {
  allowSubdomains: true,
  maxLength: 254,
};

const usernamePolicy = {
  minLength: 3,
  maxLength: 30,
  allowUnderscores: true,
  allowDots: true,
};

function validatePassword(password) {
  const errors = [];
  if (!password || password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters`);
  }
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (passwordPolicy.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (passwordPolicy.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return { valid: errors.length === 0, errors };
}

function validateEmail(email) {
  const errors = [];
  if (!email) {
    errors.push('Email is required');
    return { valid: false, errors };
  }
  if (email.length > emailPolicy.maxLength) {
    errors.push(`Email must not exceed ${emailPolicy.maxLength} characters`);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }
  return { valid: errors.length === 0, errors };
}

function validateUsername(username) {
  const errors = [];
  if (!username) {
    errors.push('Username is required');
    return { valid: false, errors };
  }
  if (username.length < usernamePolicy.minLength) {
    errors.push(`Username must be at least ${usernamePolicy.minLength} characters`);
  }
  if (username.length > usernamePolicy.maxLength) {
    errors.push(`Username must not exceed ${usernamePolicy.maxLength} characters`);
  }
  const usernameRegex = usernamePolicy.allowUnderscores && usernamePolicy.allowDots
    ? /^[a-zA-Z0-9._]+$/
    : /^[a-zA-Z0-9]+$/;
  if (!usernameRegex.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and dots');
  }
  return { valid: errors.length === 0, errors };
}

describe('Password Validation', () => {
  it('accepts valid password meeting all requirements', () => {
    const result = validatePassword('SecurePass1!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validatePassword('Short1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('rejects password without uppercase', () => {
    const result = validatePassword('nouppercase1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('rejects password without lowercase', () => {
    const result = validatePassword('NOLOWERCASE1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('rejects password without number', () => {
    const result = validatePassword('NoNumber!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('rejects password without special character', () => {
    const result = validatePassword('NoSpecial1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  it('rejects empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
  });

  it('returns multiple errors for weak password', () => {
    const result = validatePassword('weak');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('Email Validation', () => {
  it('accepts valid email', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
  });

  it('accepts email with subdomain', () => {
    const result = validateEmail('user@mail.example.com');
    expect(result.valid).toBe(true);
  });

  it('rejects empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('rejects email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('rejects email without domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
  });

  it('rejects email without local part', () => {
    const result = validateEmail('@example.com');
    expect(result.valid).toBe(false);
  });

  it('rejects email exceeding max length', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email must not exceed 254 characters');
  });
});

describe('Username Validation', () => {
  it('accepts valid username', () => {
    const result = validateUsername('john_doe');
    expect(result.valid).toBe(true);
  });

  it('accepts username with dots', () => {
    const result = validateUsername('john.doe');
    expect(result.valid).toBe(true);
  });

  it('accepts alphanumeric username', () => {
    const result = validateUsername('user123');
    expect(result.valid).toBe(true);
  });

  it('rejects empty username', () => {
    const result = validateUsername('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Username is required');
  });

  it('rejects username shorter than 3 characters', () => {
    const result = validateUsername('ab');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Username must be at least 3 characters');
  });

  it('rejects username longer than 30 characters', () => {
    const result = validateUsername('a'.repeat(31));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Username must not exceed 30 characters');
  });

  it('rejects username with special characters', () => {
    const result = validateUsername('user@name');
    expect(result.valid).toBe(false);
  });

  it('rejects username with spaces', () => {
    const result = validateUsername('user name');
    expect(result.valid).toBe(false);
  });
});
