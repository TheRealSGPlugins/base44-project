import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-heading font-light text-primary/30">404</h1>
                        <div className="h-0.5 w-16 bg-border mx-auto"></div>
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-2xl font-heading font-medium text-foreground">
                            Page Not Found
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The page <span className="font-medium text-foreground/70">"{pageName}"</span> could not be found.
                        </p>
                    </div>
                    
                    <div className="pt-6">
                        <Link
                            to="/"
                            className="inline-flex items-center px-6 py-3 text-sm font-medium text-accent-foreground bg-accent rounded-xl hover:bg-accent/80 transition-colors"
                        >
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
