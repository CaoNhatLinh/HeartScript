import LoginScreen from '@/components/auth/LoginScreen';
import { loginDestination } from '@/lib/auth-destination';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
    return <LoginScreen destination={loginDestination((await searchParams).next)} />;
}
