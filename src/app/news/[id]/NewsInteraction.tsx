
'use client';

import { useState, useOptimistic, useTransition } from 'react';
import type { NewsArticle, Comment, SimpleUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, Loader2, Send, Facebook } from 'lucide-react';
import { toggleLikeArticle, addComment } from '@/actions/newsActions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface NewsInteractionProps {
  article: NewsArticle;
  user: SimpleUser | null;
  initialComments: Comment[];
}

// --- Comment List Component ---
const CommentList = ({ comments }: { comments: Comment[] }) => {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.photoURL ?? undefined} />
            <AvatarFallback>{comment.user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{comment.user.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: de })}
              </p>
            </div>
            <p className="text-sm mt-1">{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main Interaction Component ---
export default function NewsInteraction({ article, user, initialComments }: NewsInteractionProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Optimistic state for likes
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(
    article.likes || [],
    (state, userId: string) => {
      if (state.includes(userId)) {
        return state.filter((id) => id !== userId);
      } else {
        return [...state, userId];
      }
    }
  );

  // Optimistic state for comments
  const [optimisticComments, setOptimisticComments] = useOptimistic(
    initialComments,
    (state, newComment: Comment) => [...state, newComment]
  );
  
  const [commentText, setCommentText] = useState('');

  const handleLikeClick = async () => {
    if (!user) {
      toast({ title: "Anmeldung erforderlich", description: "Du musst angemeldet sein, um zu liken." });
      return;
    }
    startTransition(() => {
      setOptimisticLikes(user.uid);
      toggleLikeArticle(article.id, user.uid).catch(() => {
        toast({ title: 'Fehler', description: 'Deine Reaktion konnte nicht gespeichert werden.', variant: 'destructive' });
      });
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newComment: Comment = {
      id: tempId,
      articleId: article.id,
      userId: user.uid,
      user: {
        displayName: user.displayName || user.email!,
        photoURL: user.photoURL,
      },
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    
    startTransition(() => {
      setOptimisticComments(newComment);
      setCommentText(''); // Clear input optimistically
      addComment(article.id, newComment.text, user).catch((err) => {
        toast({ title: "Fehler", description: err.message, variant: 'destructive' });
        // Revert UI change if API call fails (not implemented here for brevity, but would be needed in a complex app)
      });
    });
  };

  const userHasLiked = user ? optimisticLikes.includes(user.uid) : false;
  const likeCount = optimisticLikes.length;
  const canShareOnFacebook = article.source === 'Elektro Schwarzmann' && article.link;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleLikeClick} disabled={!user || isPending}>
            <Heart className={cn("mr-2 h-5 w-5", userHasLiked && "fill-primary text-primary")} />
            {likeCount}
          </Button>
           {article.commentsEnabled && user && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-5 w-5" />
                    <span>{optimisticComments.length}</span>
                </div>
            )}
        </div>
        {canShareOnFacebook && (
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(article.link!)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            <Facebook className="mr-2 h-5 w-5 text-[#1877F2]" />
            Teilen
          </a>
        )}
      </div>

      {article.commentsEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Kommentare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CommentList comments={optimisticComments} />
            {user ? (
              <form onSubmit={handleCommentSubmit} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL ?? undefined} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Dein Kommentar..."
                        rows={2}
                        disabled={isPending}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!commentText.trim() || isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <Send />}
                        </Button>
                    </div>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Du musst angemeldet sein, um einen Kommentar zu schreiben.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
