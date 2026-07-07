import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const AuthFormError = ({ message }: { message: string }) => {
  if (!message) {
    return null;
  }

  return (
    <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
      {message}
    </div>
  );
};

export const AuthFormDivider = () => (
  <div className='flex items-center gap-3 text-xs tracking-[0.18em] text-muted-foreground uppercase'>
    <div className='h-px flex-1 bg-border/70' />
    <span>Or</span>
    <div className='h-px flex-1 bg-border/70' />
  </div>
);

interface AuthGitHubButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export const AuthGitHubButton = ({
  disabled,
  onClick,
}: AuthGitHubButtonProps) => (
  <Button
    type='button'
    variant='outline'
    size='lg'
    className='w-full justify-center'
    onClick={onClick}
    disabled={disabled}
  >
    Sign in with GitHub
  </Button>
);

interface AuthInputFieldProps {
  autoComplete: string;
  icon: LucideIcon;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  value: string;
}

export const AuthInputField = ({
  autoComplete,
  icon: Icon,
  id,
  label,
  onChange,
  placeholder,
  type,
  value,
}: AuthInputFieldProps) => (
  <div className='space-y-2'>
    <label htmlFor={id} className='text-sm font-medium'>
      {label}
    </label>
    <div className='relative'>
      <Icon className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className='pl-9'
      />
    </div>
  </div>
);
