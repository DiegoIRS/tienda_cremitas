import {
  ArrowLeft, ArrowRight, Atom, Boxes, Building2, Check, ChevronDown, Circle, CreditCard,
  Droplet, Droplets, Eye, FlaskConical, Flower2, Hand, HeartHandshake, Home,
  KeyRound, LayoutDashboard, Layers3, Leaf, LogOut, MapPin, MessageCircle, MoonStar, NotebookPen, Package, PackageCheck, Palette,
  Scale, ScanFace, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Plus,
  Truck, UserRound, Waves, WheatOff, createIcons
} from "lucide";

const exelIcons = {
  ArrowLeft, ArrowRight, Atom, Boxes, Building2, Check, ChevronDown, Circle, CreditCard,
  Droplet, Droplets, Eye, FlaskConical, Flower2, Hand, HeartHandshake, Home,
  KeyRound, LayoutDashboard, Layers3, Leaf, LogOut, MapPin, MessageCircle, MoonStar, NotebookPen, Package, PackageCheck, Palette,
  Scale, ScanFace, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Plus,
  Truck, UserRound, Waves, WheatOff
};

function refreshExelIcons() {
  createIcons({
    icons: exelIcons,
    attrs: {
      "aria-hidden": "true",
      "stroke-width": "1.7"
    }
  });
}

window.refreshExelIcons = refreshExelIcons;

const iconObserver = new MutationObserver(() => {
  window.requestAnimationFrame(refreshExelIcons);
});

iconObserver.observe(document.documentElement, { childList: true, subtree: true });
refreshExelIcons();
