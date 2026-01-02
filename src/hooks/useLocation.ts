import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Location {
  lat: number;
  lng: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const requestLocation = useCallback(async (): Promise<Location | null> => {
    if (!navigator.geolocation) {
      const err = 'Geolocation is not supported by your browser';
      setError(err);
      toast({
        title: 'Location not available',
        description: err,
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          setLoading(false);
          toast({
            title: 'Location updated',
            description: 'Your location has been set',
          });
          resolve(loc);
        },
        (err) => {
          let message = 'Failed to get location';
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Location permission denied. Please enable location access.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = 'Location information unavailable';
          } else if (err.code === err.TIMEOUT) {
            message = 'Location request timed out';
          }
          setError(message);
          setLoading(false);
          toast({
            title: 'Location error',
            description: message,
            variant: 'destructive',
          });
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  }, [toast]);

  // Calculate distance between two coordinates in miles
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, []);

  return { location, loading, error, requestLocation, calculateDistance };
};
