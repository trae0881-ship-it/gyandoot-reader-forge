import { Link } from "react-router-dom";
import { BookOpen, Heart } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-muted/30">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold text-primary">GyandootNova</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Spiritual Publication & Knowledge Platform. Explore books, articles, and programs for your spiritual journey.
          </p>
        </div>
        <div>
          <h4 className="font-serif font-semibold mb-3">Explore</h4>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/books" className="hover:text-primary transition-colors">Books</Link>
            <Link to="/articles" className="hover:text-primary transition-colors">Articles</Link>
            <Link to="/donate" className="hover:text-primary transition-colors">Donate</Link>
          </nav>
        </div>
        <div>
          <h4 className="font-serif font-semibold mb-3">Support Us</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Your donations help us spread spiritual knowledge to all.
          </p>
          <Link to="/donate" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <Heart className="h-4 w-4" /> Make a Donation
          </Link>
        </div>
      </div>
      <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GyandootNova. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
