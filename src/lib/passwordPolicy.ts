export const PASSWORD_MIN_LENGTH = 10;

type PasswordPolicyValidationResult =
  | { ok: true }
  | {
      ok: false;
      message:
        | "비밀번호는 10자 이상이어야 합니다."
        | "비밀번호에는 영문이 1자 이상 포함되어야 합니다."
        | "비밀번호에는 숫자가 1자 이상 포함되어야 합니다."
        | "비밀번호에는 특수문자가 1자 이상 포함되어야 합니다."
        | "비밀번호에는 공백을 사용할 수 없습니다.";
    };

export function validatePasswordPolicy(password: string): PasswordPolicyValidationResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: "비밀번호는 10자 이상이어야 합니다." };
  }

  if (/\s/.test(password)) {
    return { ok: false, message: "비밀번호에는 공백을 사용할 수 없습니다." };
  }

  if (!/[A-Za-z]/.test(password)) {
    return { ok: false, message: "비밀번호에는 영문이 1자 이상 포함되어야 합니다." };
  }

  if (!/\d/.test(password)) {
    return { ok: false, message: "비밀번호에는 숫자가 1자 이상 포함되어야 합니다." };
  }

  // 영문/숫자 외 문자를 특수문자로 간주합니다.
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, message: "비밀번호에는 특수문자가 1자 이상 포함되어야 합니다." };
  }

  return { ok: true };
}

