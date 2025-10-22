import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
	return (
		<div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
			<SignIn
				routing="path"
				path="/login"
				signUpUrl="/sign-up"
				afterSignInUrl="/dashboard"
				appearance={{
					elements: {
						rootBox: "mx-auto",
						card: "shadow-none",
					},
				}}
			/>
		</div>
	);
}
