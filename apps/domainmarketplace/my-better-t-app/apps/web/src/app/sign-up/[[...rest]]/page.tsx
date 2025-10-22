import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
	return (
		<div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
			<SignUp
				routing="path"
				path="/sign-up"
				signInUrl="/login"
				afterSignUpUrl="/dashboard"
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

