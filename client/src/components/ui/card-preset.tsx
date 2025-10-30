import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { formatDate } from "@/lib/utils";
import { PresetList } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserBadge } from "@/components/user-badge";

interface PresetCardProps {
  preset: PresetList;
}

export function PresetCard({ preset }: PresetCardProps) {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isLinkClick = target.closest('a') || target.closest('span[role="button"]') || target.closest('button');

    if (!isLinkClick) {
      navigate(`/presets/${preset.id}`);
    }
  };

  return (
    <Card 
      className={`bg-white overflow-hidden hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer ${
        isMobile ? 'mb-4' : ''
      }`}
      onClick={handleCardClick}
      data-testid={`card-preset-${preset.id}`}
    >
      <CardContent className={`${isMobile ? "p-4 pb-2" : "p-6 pb-3"}`}>
        <div className="mb-1.5 flex items-center">
          <div className="flex-shrink-0 mr-1.5">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
              {(preset.user.nickname || preset.user.username).substring(0, 1).toUpperCase()}
            </div>
          </div>
          <Link 
            href={`/users/${preset.user.id}`} 
            className="hover:text-primary text-sm flex items-center"
            onClick={(e) => e.stopPropagation()} 
            data-testid={`link-user-${preset.user.id}`}
          >
            <UserBadge 
              user={preset.user} 
              showUsername={false} 
              showNickname={true}
              size="sm" 
            />
          </Link>
        </div>

        <h3 className="text-lg leading-6 font-medium text-foreground">
          <Link href={`/presets/${preset.id}`} className="hover:text-primary" data-testid={`link-preset-${preset.id}`}>
            {preset.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200" data-testid={`badge-type-${preset.type}`}>
            {preset.type}
          </Badge>

          {preset.tags.map((tag) => (
            <Badge 
              key={tag.id} 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/20 cursor-pointer"
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                console.log(`Filter by tag: ${tag.name}`);
              }}
              data-testid={`badge-tag-${tag.id}`}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
        <div className="mt-2">
            <div className="flex items-center">
              <span className="text-xs text-gray-400 font-light" data-testid={`text-date-${preset.id}`}>{formatDate(preset.createdAt)}</span>
            </div>
          </div>
      </CardContent>

      <CardFooter className={`${isMobile ? "px-4 pt-0 pb-2" : "px-6 pt-0 pb-4"} flex justify-end border-t border-gray-100 mt-1`}>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/presets/${preset.id}`);
          }}
          data-testid={`button-view-detail-${preset.id}`}
        >
          詳細を見る
        </Button>
      </CardFooter>
    </Card>
  );
}
