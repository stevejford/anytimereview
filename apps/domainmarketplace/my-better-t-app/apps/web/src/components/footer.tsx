import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
	return (
		<footer role="contentinfo" className="mt-auto border-t bg-background">
			<div className="container mx-auto px-4 py-12">
				{/* Top section - Links grid */}
				<div className="grid gap-8 md:grid-cols-4">
					{/* Product column */}
					<div>
						<h3 className="mb-4 text-sm font-semibold">Product</h3>
						<ul className="space-y-3 text-sm">
							<li>
								<Link
									href="/browse"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Browse Listings
								</Link>
							</li>
							<li>
								<Link
									href="/pricing"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Pricing
								</Link>
							</li>
							<li>
								<Link
									href="/how-it-works"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									How It Works
								</Link>
							</li>
						</ul>
					</div>

					{/* Resources column */}
					<div>
						<h3 className="mb-4 text-sm font-semibold">Resources</h3>
						<ul className="space-y-3 text-sm">
							<li>
								<Link
									href="/docs"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Documentation
								</Link>
							</li>
							<li>
								<Link
									href="/faq"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									FAQ
								</Link>
							</li>
							<li>
								<Link
									href="/support"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Support
								</Link>
							</li>
							<li>
								<Link
									href="/api"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									API
								</Link>
							</li>
						</ul>
					</div>

					{/* Company column */}
					<div>
						<h3 className="mb-4 text-sm font-semibold">Company</h3>
						<ul className="space-y-3 text-sm">
							<li>
								<Link
									href="/about"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									About
								</Link>
							</li>
							<li>
								<Link
									href="/blog"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Blog
								</Link>
							</li>
							<li>
								<Link
									href="/careers"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Careers
								</Link>
							</li>
						</ul>
					</div>

					{/* Legal column */}
					<div>
						<h3 className="mb-4 text-sm font-semibold">Legal</h3>
						<ul className="space-y-3 text-sm">
							<li>
								<Link
									href="/legal/terms"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Terms of Service
								</Link>
							</li>
							<li>
								<Link
									href="/legal/privacy"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link
									href="/legal/aup"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Acceptable Use Policy
								</Link>
							</li>
							<li>
								<Link
									href="/legal/dmca"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									DMCA Policy
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<Separator className="my-8" />

				{/* Bottom section */}
				<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
					<p className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} HireADomain. All rights reserved.
					</p>
					<div className="flex items-center gap-6 text-sm text-muted-foreground">
						<Link
							href="https://twitter.com"
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-foreground"
							aria-label="Twitter"
						>
							Twitter
						</Link>
						<Link
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-foreground"
							aria-label="GitHub"
						>
							GitHub
						</Link>
						<Link
							href="https://linkedin.com"
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-foreground"
							aria-label="LinkedIn"
						>
							LinkedIn
						</Link>
						<Link
							href="/status"
							className="transition-colors hover:text-foreground"
						>
							Status
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}


