import * as react from 'react';
import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes, HTMLAttributes, ElementType, SVGProps } from 'react';

type ButtonVariant = "primary" | "outline";
interface BaseProps {
    variant?: ButtonVariant;
    children: ReactNode;
    className?: string;
}
type ButtonProps = (BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
}) | (BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
});
declare function Button({ variant, as: Tag, children, className, ...rest }: ButtonProps): react.JSX.Element;

type BadgeVariant = "default" | "gold" | "dark" | "rudra";
interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
}
declare function Badge({ children, variant, className }: BadgeProps): react.JSX.Element;

interface EyebrowProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
    as?: ElementType;
}
declare function Eyebrow({ children, as: Tag, className, ...rest }: EyebrowProps): react.JSX.Element;

interface StarRatingProps {
    rating: number;
    size?: "sm" | "md" | "lg";
    showValue?: boolean;
    count?: number;
    className?: string;
}
declare function StarRating({ rating, size, showValue, count, className }: StarRatingProps): react.JSX.Element;

interface RevealProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}
declare function Reveal({ children, delay, className }: RevealProps): react.JSX.Element;

interface ReviewFormProps {
    productName: string;
    mukhi?: number;
    apiUrl?: string;
    onSubmitted?: () => void;
}
declare function ReviewForm({ productName, mukhi, apiUrl, onSubmitted }: ReviewFormProps): react.JSX.Element;

interface Review {
    id: string | number;
    rating: number;
    title?: string | null;
    body: string;
    reviewer: string;
    review_date?: string | null;
    verified?: boolean;
}
interface ReviewSummary {
    average: number;
    total: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
interface ReviewSectionProps {
    reviews: Review[];
    summary: ReviewSummary;
    pageSize?: number;
}
declare function ReviewSection({ reviews, summary, pageSize }: ReviewSectionProps): react.JSX.Element | null;

interface ProductCardProduct {
    id: string;
    name: string;
    price: number;
    mrp?: number | null;
    images: string[];
    mukhi?: number | null;
    href?: string;
    stock?: number | null;
}
interface ProductCardProps {
    product: ProductCardProduct;
    rating?: {
        average: number;
        count: number;
    } | null;
    onAddToCart?: (product: ProductCardProduct) => void;
    currency?: string;
}
declare function ProductCard({ product, rating, onAddToCart, currency }: ProductCardProps): react.JSX.Element;

interface ArticleCardArticle {
    slug: string;
    h1: string;
    heroImage?: string | null;
    cluster?: string;
    published_at?: string | null;
    excerpt?: string | null;
    href?: string;
}
interface ArticleCardProps {
    article: ArticleCardArticle;
    clusterLabels?: Record<string, string>;
}
declare function ArticleCard({ article, clusterLabels }: ArticleCardProps): react.JSX.Element;

interface WhatsAppButtonProps {
    phone: string;
    message?: string;
}
declare function WhatsAppButton({ phone, message, }: WhatsAppButtonProps): react.JSX.Element;

interface NewsletterFormProps {
    source?: string;
    showPhone?: boolean;
    onSuccess?: () => void;
    compact?: boolean;
    apiUrl?: string;
}
declare function NewsletterForm({ source, showPhone, onSuccess, compact, apiUrl, }: NewsletterFormProps): react.JSX.Element;

declare const BagIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const CloseIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const MenuIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const PlusIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const MinusIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const CheckIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const ArrowIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const ShieldIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const TruckIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const ReturnIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const LeafIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;
declare const WhatsAppIcon: (p: SVGProps<SVGSVGElement>) => react.JSX.Element;

export { ArrowIcon, ArticleCard, type ArticleCardArticle, type ArticleCardProps, Badge, type BadgeProps, type BadgeVariant, BagIcon, Button, type ButtonProps, type ButtonVariant, CheckIcon, CloseIcon, Eyebrow, type EyebrowProps, LeafIcon, MenuIcon, MinusIcon, NewsletterForm, type NewsletterFormProps, PlusIcon, ProductCard, type ProductCardProduct, type ProductCardProps, ReturnIcon, Reveal, type RevealProps, type Review, ReviewForm, type ReviewFormProps, ReviewSection, type ReviewSectionProps, type ReviewSummary, ShieldIcon, StarRating, type StarRatingProps, TruckIcon, WhatsAppButton, type WhatsAppButtonProps, WhatsAppIcon };
