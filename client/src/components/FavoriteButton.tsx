import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  type: "facility" | "resource";
  itemId: number;
}

export default function FavoriteButton({ type, itemId }: FavoriteButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to check if item is favorited
  const { data: favoriteStatus, isLoading } = useQuery({
    queryKey: [`/api/favorites/${type}/${itemId}`],
    refetchOnWindowFocus: false,
  });

  // Local state for optimistic updates
  const [isFavorited, setIsFavorited] = useState(false);

  // Update local state when query data changes
  useEffect(() => {
    if (favoriteStatus?.isFavorite !== undefined) {
      setIsFavorited(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, itemId }),
      });
      if (!response.ok) throw new Error("Failed to add favorite");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${type}/${itemId}`] });
      toast({
        title: "Added to favorites",
        description: "This item has been added to your favorites.",
      });
    },
    onError: () => {
      setIsFavorited(false); // Revert optimistic update
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
      });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorites/${type}/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove favorite");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${type}/${itemId}`] });
      toast({
        title: "Removed from favorites",
        description: "This item has been removed from your favorites.",
      });
    },
    onError: () => {
      setIsFavorited(true); // Revert optimistic update
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
      });
    },
  });

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited); // Optimistic update
    if (!isFavorited) {
      addFavoriteMutation.mutate();
    } else {
      removeFavoriteMutation.mutate();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`hover:bg-transparent ${isFavorited ? 'text-red-500' : 'text-gray-400'}`}
    >
      <Heart
        className={`h-6 w-6 ${isFavorited ? 'fill-current' : ''}`}
      />
      <span className="sr-only">
        {isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      </span>
    </Button>
  );
}
