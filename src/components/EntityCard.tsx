import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export interface EntityCardProps {
  id: string;
  name: string;
  description: string;
  tags: string[];
  image_url: string;
  onAdd: (id: string) => void;
  onViewMap?: (id: string) => void;
}

const EntityCard = ({ id, name, description, tags, image_url, onAdd, onViewMap }: EntityCardProps) => {
  return (
    <article className="card-surface flex flex-col overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <img src={image_url} alt={name} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg font-semibold text-steel-gray">{name}</h3>
          <p className="mt-2 text-sm text-steel-gray/70 line-clamp-3">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-green">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted-green/10 px-2 py-1 uppercase tracking-wide">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto flex gap-2">
          <Button variant="primary" className="flex-1" onClick={() => onAdd(id)}>
            Add to Itinerary
          </Button>
          <Button variant="ghost" onClick={() => onViewMap?.(id)}>
            View on Map
          </Button>
        </div>
        <Link to={`/entity/${id}`} className="text-sm font-semibold text-muted-green">
          Explore details →
        </Link>
      </div>
    </article>
  );
};

export default EntityCard;
