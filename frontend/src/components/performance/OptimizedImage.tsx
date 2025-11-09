import React, { useState, useEffect, useRef } from 'react';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  blur?: boolean;
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  lazy = true,
  blur = true,
  placeholder,
  fallback = '/placeholder-image.png',
  onLoad,
  onError,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallback : src;
  const shouldShowPlaceholder = !isLoaded && placeholder;

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder or blur */}
      {shouldShowPlaceholder && (
        <img
          src={placeholder}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover ${
            blur ? 'filter blur-lg' : ''
          }`}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          {...props}
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && !shouldShowPlaceholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};

export interface ResponsiveImageProps extends OptimizedImageProps {
  srcSet?: {
    small: string;
    medium: string;
    large: string;
  };
  sizes?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  srcSet,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  alt,
  ...props
}) => {
  const srcSetString = srcSet
    ? `${srcSet.small} 640w, ${srcSet.medium} 1024w, ${srcSet.large} 1920w`
    : undefined;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      srcSet={srcSetString}
      sizes={sizes}
      {...props}
    />
  );
};

export interface ImageWithFallbackProps extends OptimizedImageProps {
  sources: string[];
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  sources,
  alt,
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleError = () => {
    if (currentIndex < sources.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <OptimizedImage
      src={sources[currentIndex]}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
};

export default OptimizedImage;
