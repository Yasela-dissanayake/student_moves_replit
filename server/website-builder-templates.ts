/**
 * Templates library for the Enhanced Website Builder
 * Contains pre-built component templates organized by category
 */

export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  code: string;
  previewImage?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  dependencies?: string[];
}

// Collection of ready-to-use component templates
export const componentTemplates: ComponentTemplate[] = [
  // Data Tables
  {
    id: 'data-table-basic',
    name: 'Basic Data Table',
    description: 'Simple data table for displaying structured information',
    category: 'tables',
    tags: ['data', 'table', 'display'],
    code: `import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DataTableProps<T> {
  data: T[];
  columns: { key: keyof T; label: string }[];
}

export function BasicDataTable<T>({ data, columns }: DataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, i) => (
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {String(item[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}`
  },
  {
    id: 'data-table-pagination',
    name: 'Paginated Data Table',
    description: 'Interactive data table with pagination controls',
    category: 'tables',
    tags: ['data', 'table', 'pagination'],
    code: `import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginatedDataTableProps<T> {
  data: T[];
  columns: { key: keyof T; label: string }[];
  itemsPerPage?: number;
}

export function PaginatedDataTable<T>({ 
  data, 
  columns, 
  itemsPerPage = 10 
}: PaginatedDataTableProps<T>) {
  const [page, setPage] = useState(0);
  
  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {String(item[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {page + 1} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      )}
    </div>
  );
}`
  },
  
  // Forms
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Standard contact form with name, email, and message fields',
    category: 'forms',
    tags: ['form', 'contact', 'input'],
    code: `import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  message: z.string().min(10, {
    message: 'Message must be at least 10 characters.',
  }),
});

export function ContactForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Replace with your form submission logic
    console.log(values);
    toast({
      title: 'Form submitted!',
      description: 'We received your message and will get back to you soon.',
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your email address" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Your message"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Send Message</Button>
      </form>
    </Form>
  );
}`
  },
  
  // Navigation
  {
    id: 'responsive-navbar',
    name: 'Responsive Navbar',
    description: 'Mobile-friendly navigation bar with dropdown menu',
    category: 'navigation',
    tags: ['navigation', 'header', 'responsive'],
    code: `import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

interface NavLink {
  label: string;
  href: string;
}

interface ResponsiveNavbarProps {
  logo?: string;
  links: NavLink[];
}

export function ResponsiveNavbar({ logo, links }: ResponsiveNavbarProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            {logo ? (
              <img src={logo} alt="Logo" className="h-6 w-auto" />
            ) : (
              <span className="font-bold text-xl">Logo</span>
            )}
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Button>Get Started</Button>
          </nav>
          
          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-6">
                {links.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className="text-base font-medium transition-colors hover:text-primary"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button className="mt-2">Get Started</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}`
  },
  
  // Cards
  {
    id: 'feature-card',
    name: 'Feature Card',
    description: 'Highlight key features with icon and description',
    category: 'cards',
    tags: ['card', 'feature', 'display'],
    code: `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <div className="rounded-full bg-primary/10 p-2 w-10 h-10 flex items-center justify-center mb-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}`
  },
  
  // Layout
  {
    id: 'hero-section',
    name: 'Hero Section',
    description: 'Attention-grabbing hero section with call-to-action',
    category: 'layout',
    tags: ['hero', 'landing', 'header'],
    complexity: 'beginner',
    code: `import React from 'react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta?: string;
  primaryCtaUrl: string;
  secondaryCtaUrl?: string;
  backgroundClass?: string;
}

export function HeroSection({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  primaryCtaUrl,
  secondaryCtaUrl,
  backgroundClass = 'bg-muted',
}: HeroSectionProps) {
  return (
    <section className={\`\${backgroundClass} py-16 md:py-24\`}>
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              {title}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button asChild size="lg">
              <a href={primaryCtaUrl}>{primaryCta}</a>
            </Button>
            {secondaryCta && secondaryCtaUrl && (
              <Button variant="outline" size="lg" asChild>
                <a href={secondaryCtaUrl}>{secondaryCta}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}`
  },
  
  {
    id: 'features-grid',
    name: 'Features Grid',
    description: 'Responsive grid layout for showcasing features or services',
    category: 'layout',
    tags: ['features', 'grid', 'responsive', 'services'],
    complexity: 'intermediate',
    code: `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Share2, Shield, Zap } from 'lucide-react';

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function FeaturesGrid() {
  const features: FeatureItem[] = [
    {
      title: "Lightning Fast",
      description: "Optimized for speed and performance across all devices and network conditions.",
      icon: <Zap className="h-6 w-6 text-primary" />,
    },
    {
      title: "Highly Secure",
      description: "Enterprise-grade security with advanced encryption and protection.",
      icon: <Shield className="h-6 w-6 text-primary" />,
    },
    {
      title: "Easy Sharing",
      description: "Seamlessly share content across teams and collaborate in real-time.",
      icon: <Share2 className="h-6 w-6 text-primary" />,
    },
    {
      title: "Reliability",
      description: "99.9% uptime guarantee with redundant systems and backups.",
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Features that set us apart</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Our platform provides everything you need to succeed, with tools designed for maximum productivity and ease of use.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 transition-all hover:border-primary">
              <CardHeader className="pb-2">
                <div className="mb-3">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}`
  },
  
  {
    id: 'pricing-table',
    name: 'Pricing Table',
    description: 'Comparison table for displaying pricing plans and features',
    category: 'pricing',
    tags: ['pricing', 'table', 'subscription', 'comparison'],
    complexity: 'intermediate',
    dependencies: ['lucide-react'],
    code: `import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  interval: string;
  features: Array<{
    name: string;
    included: boolean;
  }>;
  buttonText: string;
  popular?: boolean;
}

export function PricingTable() {
  const plans: PricingPlan[] = [
    {
      name: "Basic",
      description: "Essential features for small teams",
      price: "$9",
      interval: "per user / month",
      features: [
        { name: "Up to 10 users", included: true },
        { name: "2GB storage per user", included: true },
        { name: "Email support", included: true },
        { name: "API access", included: false },
        { name: "Advanced security", included: false },
        { name: "Custom integrations", included: false },
      ],
      buttonText: "Get Started",
    },
    {
      name: "Professional",
      description: "Perfect for growing teams with more needs",
      price: "$19",
      interval: "per user / month",
      features: [
        { name: "Unlimited users", included: true },
        { name: "10GB storage per user", included: true },
        { name: "Priority email & chat support", included: true },
        { name: "API access", included: true },
        { name: "Advanced security", included: true },
        { name: "Custom integrations", included: false },
      ],
      buttonText: "Start Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "Advanced features for large organizations",
      price: "$49",
      interval: "per user / month",
      features: [
        { name: "Unlimited users", included: true },
        { name: "Unlimited storage", included: true },
        { name: "24/7 phone, email & chat support", included: true },
        { name: "API access", included: true },
        { name: "Advanced security", included: true },
        { name: "Custom integrations", included: true },
      ],
      buttonText: "Contact Sales",
    },
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that's right for your team. All plans include a 14-day free trial.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={\`flex flex-col \${plan.popular ? 'border-primary shadow-lg relative' : ''}\`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                      )}
                      <span className={feature.included ? '' : 'text-muted-foreground'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}`
  },
  
  {
    id: 'testimonials-carousel',
    name: 'Testimonials Carousel',
    description: 'Animated carousel for customer testimonials and reviews',
    category: 'marketing',
    tags: ['testimonials', 'carousel', 'reviews', 'social proof'],
    complexity: 'advanced',
    dependencies: ['embla-carousel-react'],
    code: `import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  image?: string;
}

export function TestimonialsCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const testimonials: Testimonial[] = [
    {
      quote: "This platform transformed how our team collaborates. The intuitive interface and powerful features have increased our productivity by over 40%.",
      name: "Alex Thompson",
      title: "CTO, TechForward",
      image: "https://i.pravatar.cc/150?img=1",
    },
    {
      quote: "The customer support is exceptional. Any time we've had questions, the team has been quick to respond and incredibly helpful.",
      name: "Sarah Patel",
      title: "Operations Manager, Innovate Inc.",
      image: "https://i.pravatar.cc/150?img=5",
    },
    {
      quote: "We've been able to scale our operations seamlessly thanks to this solution. It's been a game-changer for our business growth.",
      name: "Michael Rodriguez",
      title: "CEO, GrowthWorks",
      image: "https://i.pravatar.cc/150?img=8",
    },
  ];

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">What our clients say</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Don't just take our word for it — hear from some of our satisfied customers.
          </p>
        </div>
        
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {testimonials.map((testimonial, index) => (
                <div className="flex-[0_0_100%] min-w-0 pl-4" key={index}>
                  <Card className="border-none shadow-md mx-auto max-w-3xl h-full">
                    <CardContent className="pt-6 pb-8 px-8">
                      <div className="flex items-start mb-6">
                        <Quote className="h-10 w-10 text-primary opacity-80 mr-3 flex-shrink-0" />
                      </div>
                      <p className="text-lg md:text-xl mb-6 italic">"{testimonial.quote}"</p>
                      <div className="flex items-center mt-6">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarImage src={testimonial.image} alt={testimonial.name} />
                          <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-8 gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className="rounded-full h-10 w-10"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous slide</span>
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className="rounded-full h-10 w-10"
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next slide</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}`
  },
  
  // Authentication Components
  {
    id: 'login-form',
    name: 'Login Form',
    description: 'Secure login form with email and password fields',
    category: 'authentication',
    tags: ['auth', 'login', 'form', 'security'],
    complexity: 'beginner',
    code: `import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const loginFormSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  function onSubmit(values: LoginFormValues) {
    // Replace with your authentication logic
    console.log(values);
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Remember me</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </Form>
      
      <div className="text-center text-sm">
        <a href="#" className="text-primary hover:underline">
          Forgot password?
        </a>
      </div>
    </div>
  );
}`
  },
  
  // Dashboard Components
  {
    id: 'stats-dashboard',
    name: 'Stats Dashboard Cards',
    description: 'Set of dashboard cards for displaying key metrics and statistics',
    category: 'dashboard',
    tags: ['dashboard', 'statistics', 'metrics', 'analytics'],
    complexity: 'intermediate',
    dependencies: ['lucide-react'],
    code: `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, CreditCard, DollarSign, Users, Activity } from 'lucide-react';

export function StatsDashboard() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1%",
      trend: "up",
      description: "compared to last month",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Subscriptions",
      value: "+2,350",
      change: "+180",
      trend: "up",
      description: "new subscriptions this week",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Sales",
      value: "+12,234",
      change: "-19.5%",
      trend: "down",
      description: "compared to last month",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Active Users",
      value: "+573",
      change: "+201",
      trend: "up",
      description: "active users right now",
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center pt-1">
              {stat.trend === "up" ? (
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                {stat.change}
              </span>
              <span className="ml-1">{stat.description}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}`
  },
  
  // Utility Components
  {
    id: 'multi-step-wizard',
    name: 'Multi-Step Wizard',
    description: 'Interactive multi-step form with progress tracking',
    category: 'forms',
    tags: ['wizard', 'multi-step', 'form', 'workflow'],
    complexity: 'advanced',
    code: `import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';

// Define the schemas for each step
const personalInfoSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const planSelectionSchema = z.object({
  plan: z.enum(["basic", "pro", "enterprise"], {
    required_error: "Please select a plan.",
  }),
});

const additionalInfoSchema = z.object({
  comments: z.string().optional(),
  referral: z.string().optional(),
});

// Combined schema
const formSchema = z.object({
  ...personalInfoSchema.shape,
  ...planSelectionSchema.shape,
  ...additionalInfoSchema.shape,
});

type FormValues = z.infer<typeof formSchema>;

export function MultiStepWizard() {
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      plan: "basic" as const,
      comments: "",
      referral: "",
    },
    mode: "onChange",
  });
  
  const steps = [
    {
      id: "Step 1",
      name: "Personal Information",
      fields: ["firstName", "lastName", "email"],
      schema: personalInfoSchema,
    },
    {
      id: "Step 2",
      name: "Select Plan",
      fields: ["plan"],
      schema: planSelectionSchema,
    },
    {
      id: "Step 3",
      name: "Additional Information",
      fields: ["comments", "referral"],
      schema: additionalInfoSchema,
    },
    {
      id: "Step 4",
      name: "Complete",
    },
  ];

  const currentSchema = steps[step]?.schema;
  
  function validateCurrentStep() {
    if (!currentSchema) return true;
    
    const currentFields = steps[step].fields;
    const currentValues = {} as any;
    
    currentFields.forEach((field) => {
      currentValues[field] = form.getValues(field as any);
    });
    
    try {
      currentSchema.parse(currentValues);
      return true;
    } catch (error) {
      // Trigger validation for current fields
      currentFields.forEach((field) => {
        form.trigger(field as any);
      });
      return false;
    }
  }

  function nextStep() {
    if (validateCurrentStep()) {
      if (step < steps.length - 1) {
        setStep(step + 1);
        if (step === steps.length - 2) {
          setIsComplete(true);
        }
      }
    }
  }

  function prevStep() {
    if (step > 0) {
      setStep(step - 1);
      if (isComplete) {
        setIsComplete(false);
      }
    }
  }

  function onSubmit(data: FormValues) {
    // Handle the complete form submission
    console.log('Form submitted:', data);
    nextStep();
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
            >
              <div
                className={\`w-10 h-10 rounded-full flex items-center justify-center \${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "border-2 border-primary bg-background text-primary"
                    : "border-2 border-muted bg-background text-muted-foreground"
                }\`}
              >
                {i < step ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className="text-xs mt-1">{s.name}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted" />
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-300"
            style={{ width: \`\${(step / (steps.length - 1)) * 100}%\` }}
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Personal Information */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Select a Plan</h2>
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Subscription Plan</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value="basic" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-medium">Basic</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              $9/month - Essential features for small teams
                            </p>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value="pro" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-medium">Professional</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              $19/month - Advanced features for growing teams
                            </p>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value="enterprise" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-medium">Enterprise</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              $49/month - Premium features for large organizations
                            </p>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Additional Information */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Additional Information</h2>
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments or Special Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about any specific needs or questions you have..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referral"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter referral code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 3 && (
            <div className="text-center py-12">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for completing the form. We will process your information and contact you shortly.
              </p>
              <pre className="bg-muted p-4 rounded-md text-left overflow-auto max-h-60 text-xs">
                {JSON.stringify(form.getValues(), null, 2)}
              </pre>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 0}
            >
              Previous
            </Button>
            
            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                {step === steps.length - 2 ? "Submit" : "Next"}
              </Button>
            ) : (
              <Button type="button" onClick={() => setStep(0)}>
                Start Over
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}`
  },
  
  // Data Visualization
  {
    id: 'analytics-chart',
    name: 'Analytics Chart',
    description: 'Interactive chart for data visualization and analytics',
    category: 'data-visualization',
    tags: ['chart', 'analytics', 'data', 'visualization', 'graph'],
    complexity: 'intermediate',
    dependencies: ['react-chartjs-2', 'chart.js'],
    code: `import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function AnalyticsChart() {
  const [timeRange, setTimeRange] = React.useState('30d');
  
  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  // Sample data - this would come from your API
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [65, 59, 80, 81, 56, 55, 72, 88, 95, 91, 84, 89],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Expenses',
        data: [28, 48, 40, 19, 43, 27, 32, 45, 50, 46, 42, 48],
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        tension: 0.3,
      },
    ],
  };
  
  // Filter options
  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Revenue vs Expenses</CardTitle>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">Export</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: '400px' }}>
          <Line options={options} data={data} />
        </div>
      </CardContent>
    </Card>
  );
}`
  }
];

// Helper function to filter templates
export function filterTemplates(
  category?: string,
  tags?: string[],
  complexity?: 'beginner' | 'intermediate' | 'advanced'
): ComponentTemplate[] {
  let result = [...componentTemplates];
  
  if (category && category !== 'all') {
    result = result.filter(template => template.category === category);
  }
  
  if (tags && tags.length > 0) {
    result = result.filter(template => 
      tags.some(tag => template.tags.includes(tag))
    );
  }
  
  if (complexity) {
    result = result.filter(template => {
      // Only show exact match for complexity, except for beginner templates 
      // which can appear in all levels if they don't have complexity specified
      if (complexity === 'beginner') {
        // For beginner, show templates with no complexity or beginner complexity
        return template.complexity === 'beginner' || !template.complexity;
      } else if (complexity === 'intermediate') {
        // For intermediate, only show intermediate templates
        return template.complexity === 'intermediate';
      } else if (complexity === 'advanced') {
        // For advanced, only show advanced templates
        return template.complexity === 'advanced';
      }
      return true;
    });
  }
  
  return result;
}

// Helper function to get unique categories
export function getTemplateCategories(): string[] {
  return [...new Set(componentTemplates.map(template => template.category))];
}

// Helper function to get unique tags
export function getTemplateTags(): string[] {
  const allTags = componentTemplates.flatMap(template => template.tags);
  return [...new Set(allTags)];
}