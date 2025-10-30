import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white mt-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-muted-foreground text-sm">&copy; 2025 Loopedia. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary text-sm">
              利用規約
            </Link>
            <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary text-sm">
              プライバシーポリシー
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-primary text-sm">
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
