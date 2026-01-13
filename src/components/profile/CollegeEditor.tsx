import { useState } from 'react';
import { GraduationCap, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const POPULAR_COLLEGES = [
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'BITS Pilani', 'NIT Trichy', 'NIT Warangal', 'Delhi University',
  'JNU', 'St. Xavier\'s College', 'Christ University', 'Manipal University',
  'VIT Vellore', 'SRM University', 'Amity University', 'Lovely Professional University',
  'Anna University', 'Mumbai University', 'Bangalore University',
  'IIM Ahmedabad', 'IIM Bangalore', 'IIM Calcutta', 'ISB Hyderabad',
  'AIIMS Delhi', 'JIPMER', 'CMC Vellore', 'NIFT Delhi',
];

interface CollegeEditorProps {
  currentCollege: string | null;
  onSave: (college: string) => Promise<void>;
  isEditing: boolean;
}

const CollegeEditor = ({ currentCollege, onSave, isEditing }: CollegeEditorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(currentCollege || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const filteredColleges = POPULAR_COLLEGES.filter(college =>
    college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedCollege.trim()) return;
    
    setSaving(true);
    try {
      await onSave(selectedCollege);
      toast({
        title: 'College updated',
        description: `Your college has been set to ${selectedCollege}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update college',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <span className="text-foreground">
          {currentCollege || 'Not set'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for your college..."
          className="pl-10 border-2 border-foreground"
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredColleges.map((college) => (
          <button
            key={college}
            onClick={() => setSelectedCollege(college)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
              selectedCollege === college
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <span className="text-sm">{college}</span>
            {selectedCollege === college && <Check className="w-4 h-4" />}
          </button>
        ))}
        
        {/* Custom input option */}
        {searchQuery && !filteredColleges.includes(searchQuery) && (
          <button
            onClick={() => setSelectedCollege(searchQuery)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
              selectedCollege === searchQuery
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted border-2 border-dashed border-primary'
            }`}
          >
            <span className="text-sm">
              Add "{searchQuery}"
            </span>
            {selectedCollege === searchQuery && <Check className="w-4 h-4" />}
          </button>
        )}
      </div>

      {selectedCollege && selectedCollege !== currentCollege && (
        <Button
          variant="hero"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : `Set as ${selectedCollege}`}
        </Button>
      )}
    </div>
  );
};

export default CollegeEditor;
