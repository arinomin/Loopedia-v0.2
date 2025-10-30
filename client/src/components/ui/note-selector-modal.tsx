import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MusicalNoteOption } from "@/lib/parameter-config";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NoteSelectorModalProps {
  value: string;
  options: (MusicalNoteOption | string)[];
  onChange: (value: string) => void;
  title?: string;
  isNumeric: boolean;
  onNumericChange: (isNumeric: boolean) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NoteSelectorModal({
  value,
  options,
  onChange,
  title = "音符を選択",
  isNumeric,
  onNumericChange,
  min = 0,
  max = 100,
  step = 1
}: NoteSelectorModalProps) {
  const [numericValue, setNumericValue] = useState<number>(
    isNumeric && !isNaN(Number(value)) ? Number(value) : 50
  );
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(isNumeric ? "numeric" : "musical");

  const handleCloseAndApply = () => {
    if (activeTab === "numeric") {
      onNumericChange(true);
      onChange(String(numericValue));
    } else {
      onNumericChange(false);
    }
    setOpen(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleNumericChange = (newValue: number) => {
    setNumericValue(newValue);
  };

  const handleOptionSelect = (selectedValue: string) => {
    onChange(selectedValue);
  };

  const renderTriggerContent = () => {
    if (isNumeric) {
      return <span className="font-mono">{value}</span>;
    }

    const noteMatch = value.match(/notes(\d+)/);
    if (noteMatch) {
      return (
        <img 
          src={`/src/assets/notes/${value}.png`}
          alt={value}
          className="h-5 object-contain"
        />
      );
    }

    return <span className="font-mono text-sm">{value}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-3 py-2"
        >
          {renderTriggerContent()}
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md" 
        aria-describedby="note-selector-description"
        aria-labelledby="note-selector-title"
      >
        <DialogHeader>
          <DialogTitle id="note-selector-title">{title}</DialogTitle>
          <DialogDescription id="note-selector-description">
            入力方法を選択して値を設定してください
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="musical">
              音楽的
            </TabsTrigger>
            <TabsTrigger value="numeric">
              数値
            </TabsTrigger>
          </TabsList>

          <TabsContent value="musical" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-4 gap-3 p-1 mb-4">
                {['4MEAS', '2MEAS', '1MEAS'].map((measValue) => {
                  const isSelected = value === measValue;

                  return (
                    <Button
                      key={`text-${measValue}`}
                      variant="ghost"
                      className={`p-2 aspect-square relative flex items-center justify-center text-xs
                        ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'}`}
                      onClick={() => handleOptionSelect(measValue)}
                    >
                      <span className="text-center font-mono">{measValue}</span>
                      {isSelected && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </Button>
                  );
                })}

                {Array.from({ length: 11 }, (_, i) => {
                  const noteValue = `notes${i + 1}`;
                  const imagePath = `/src/assets/notes/${noteValue}.png`;
                  const isSelected = value === noteValue;

                  return (
                    <Button
                      key={`img-${noteValue}`}
                      variant="ghost"
                      className={`p-2 aspect-square relative flex flex-col items-center justify-center text-xs gap-1
                        ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'}`}
                      onClick={() => handleOptionSelect(noteValue)}
                    >
                      <img 
                        src={imagePath} 
                        alt={noteValue} 
                        className="w-10 h-10 object-contain"
                      />
                      {isSelected && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
            <Button className="w-full mt-2" onClick={handleCloseAndApply}>
              選択完了
            </Button>
          </TabsContent>

          <TabsContent value="numeric" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Slider
                  value={[numericValue]}
                  min={min}
                  max={max}
                  step={step}
                  onValueChange={(values) => handleNumericChange(values[0])}
                  className="flex-grow"
                />
                <Input
                  type="number"
                  value={numericValue}
                  onChange={(e) => handleNumericChange(Number(e.target.value))}
                  className="w-20"
                />
              </div>
              <Button className="w-full" onClick={handleCloseAndApply}>
                選択完了
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}