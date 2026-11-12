import { useSearchParams } from 'react-router-dom';
import { LoginForm } from '@/features/auth/LoginForm';
import { RegisterForm } from '@/features/auth/RegisterForm';

export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isRegister = searchParams.get('mode') === 'register';

  return (
    <div className="py-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        {isRegister ? <RegisterForm /> : <LoginForm />}

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setSearchParams({ mode: isRegister ? 'login' : 'register' })}
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold cursor-pointer"
          >
            {isRegister
              ? 'Already have an account? Sign in here'
              : "Don't have an account? Register now"}
          </button>
        </div>
      </div>
    </div>
  );
}
