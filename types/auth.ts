export interface AuthLoadingModalProps {
  open: boolean;
}

export interface AuthTabsProps {
  className?: string;
  onLoginSuccess?: () => void;
  onAuthStart?: () => void;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ForgotPasswordFormProps {
  className?: string;
}

export interface GoogleLoginButtonProps {
  variant?: "default" | "outline";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  onSuccess?: () => void;
  onAuthStart?: () => void;
}

export interface LoginCardProps {
  className?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onSuccess?: () => void;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignupFormProps {
  onSuccess?: () => void;
}

export interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthStart?: () => void;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordFormProps {
  className?: string;
}

