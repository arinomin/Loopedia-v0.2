import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ParameterConfig } from "@/lib/effects";
import { MusicalNoteOption } from "@/lib/parameter-config";
import { Checkbox } from "@/components/ui/checkbox";
import { NoteSelectorModal } from "@/components/ui/note-selector-modal";

interface ParameterInputProps {
  name: string;
  config: ParameterConfig;
  value: any;
  onChange: (name: string, value: any) => void;
  useSwitch?: boolean; // ON/OFFをスイッチUIで表示するオプション
}

export function ParameterInput({ name, config, value, onChange, useSwitch = false }: ParameterInputProps) {
  const [internalValue, setInternalValue] = useState<any>(value !== undefined ? value : config.defaultValue);
  const [isNumeric, setIsNumeric] = useState<boolean>(config.isNumeric || false);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: any) => {
    setInternalValue(newValue);
    onChange(name, newValue);
  };

  // パラメータの表示名を生成（アンダースコアをスペースに置き換え、プレフィックスを削除）
  const getDisplayName = () => {
    // ヘッダーとして使用する特別なパラメータの場合
    if (name === "STEP_LENGTH_HEADER" || name === "STEP_LEVEL_HEADER") {
      return config.defaultValue as string;
    }

    const parts = name.split('_');
    // プレフィックスが存在する場合はそれを削除（LPF_RATE など）
    if (parts.length > 1 && parts[0].toUpperCase() === parts[0]) {
      return parts.slice(1).join(' ');
    }
    // SEQ_VAL1などの場合は、数字を取り出す
    if (name.startsWith('SEQ_VAL') && parts.length === 2) {
      const valNumber = parts[1].replace('VAL', '');
      return `VAL ${valNumber}`;
    }
    // STEP_LEN/LVL1-16などの場合は、数字を取り出す
    if ((name.includes('STEP_LEN') || name.includes('STEP_LVL')) && parts.length >= 3) {
      const valNumber = parts[parts.length - 1].replace(/[A-Za-z]+/, '');
      return `${parts[parts.length - 2] === 'LEN' ? 'LEN' : 'LVL'} ${valNumber}`;
    }
    return name.replace(/_/g, ' ');
  };

  const displayValue = () => {
    if (config.type === 'range' || (config.type === 'combined' && isNumeric)) {
      if (isNaN(Number(internalValue))) {
        return "0";
      }
      const value = Number(internalValue);
      if (name.includes('TIME') || name.includes('PRE_DELAY')) {
        return `${value}ms`;
      } else if (name.includes('FREQ') || name.includes('LOW_CUT') || name.includes('HIGH_CUT')) {
        return `${value}Hz`;
      } else {
        return value;
      }
    }
    return internalValue;
  };

  // ON/OFFスイッチ用UI（SEQ_SW, SEQ_SYNC, SEQ_RETRIG向け）
  if (useSwitch && config.type === 'select' && config.options?.some(opt => 
    (typeof opt === 'string' && opt === 'ON') || 
    (typeof opt === 'object' && (opt as any).value === 'ON')) && 
    config.options?.some(opt => 
      (typeof opt === 'string' && opt === 'OFF') || 
      (typeof opt === 'object' && (opt as any).value === 'OFF'))) {
    return (
      <div className="space-y-2">
        <div className="flex flex-col">
          <Label htmlFor={name} className="text-sm font-medium mb-1">
            {getDisplayName()}
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              id={name}
              checked={internalValue === 'ON'}
              onCheckedChange={(checked) => handleValueChange(checked ? 'ON' : 'OFF')}
            />
            <span className="text-xs text-muted-foreground">
              {internalValue === 'ON' ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 複合型パラメータ（音符/数値の切り替え可能）
  if (config.type === 'combined') {
    // 画像形式の音符を使用するかどうか
    const useImageNotes = config.useImageNotes || false;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor={name} className="text-sm font-medium">
            {getDisplayName()}
          </Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${name}-numeric-toggle`}
              checked={isNumeric}
              onCheckedChange={(checked) => {
                const isChecked = !!checked;
                setIsNumeric(isChecked);
                // 音符モードから数値モードに切り替える場合は値を初期化
                if (isChecked && typeof internalValue !== 'number') {
                  handleValueChange(50); // デフォルトの数値
                }
                // 数値モードから音符モードに切り替える場合は値を初期化
                else if (!isChecked && typeof internalValue === 'number') {
                  handleValueChange(config.defaultValue);
                }
              }}
            />
            <Label
              htmlFor={`${name}-numeric-toggle`}
              className="text-xs text-muted-foreground"
            >
              数値で入力
            </Label>
          </div>
        </div>

        {isNumeric ? (
          // 数値モード
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <Slider
                id={name}
                min={config.min || 0}
                max={config.max || 100}
                step={config.step || 1}
                value={[isNaN(Number(internalValue)) ? 0 : Number(internalValue)]}
                onValueChange={(values) => handleValueChange(values[0])}
                className="flex-grow"
              />
              <span className="text-sm font-mono w-14 text-left">
                {displayValue()}
              </span>
            </div>
          </div>
        ) : (
          // 音符モード - モーダル選択UI
          <NoteSelectorModal
            value={String(internalValue)}
            onChange={(value) => handleValueChange(value)}
            options={config.options || []}
            title={getDisplayName()}
            isNumeric={isNumeric}
            onNumericChange={setIsNumeric}
            min={config.min || 0}
            max={config.max || 100}
            step={config.step || 1}
            useImageNotes={useImageNotes}
          />
        )}
      </div>
    );
  }

  // 通常の選択型
  if (config.type === 'select') {
    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="text-sm font-medium">
          {getDisplayName()}
        </Label>
        <Select
          value={String(internalValue)}
          onValueChange={(value) => handleValueChange(value)}
        >
          <SelectTrigger id={name}>
            <SelectValue placeholder={`Select ${getDisplayName()}`} />
          </SelectTrigger>
          <SelectContent>
            {config.options?.map((option, index) => {
                const value = typeof option === 'string' ? option : option.value;
                // 空文字列や未定義の場合はスキップ
                if (!value || value === '') return null;
                const displayValue = typeof option === 'string' ? option : option.label || option.value;
                // 表示値も空でないことを確認
                if (!displayValue || displayValue === '') return null;
                
                return (
                  <SelectItem 
                    key={`${value}-${index}`} 
                    value={value}
                  >
                    {displayValue}
                  </SelectItem>
                );
              })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // スライダー型
  if (config.type === 'range') {
    // 値に+/-記号を含める（-50～+50のような値範囲の場合）
    const formatValue = (val: any) => {
      if (isNaN(Number(val))) {
        return "0";
      }
      const numVal = Number(val);
      if (config.min && config.min < 0 && numVal > 0) {
        return `+${numVal}`;
      }
      return numVal;
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="text-sm font-medium">
          {getDisplayName()}
        </Label>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <Slider
              id={name}
              min={config.min || 0}
              max={config.max || 100}
              step={config.step || 1}
              value={[isNaN(Number(internalValue)) ? 0 : Number(internalValue)]}
              onValueChange={(values) => handleValueChange(values[0])}
              className="flex-grow"
            />
            <span className="text-sm font-mono w-14 text-left">
              {formatValue(internalValue)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ヘッダーセクション（特別なテキストタイプ）
  if (config.type === 'text' && (name === "STEP_LENGTH_HEADER" || name === "STEP_LEVEL_HEADER")) {
    return (
      <div className="col-span-full mt-4 mb-2">
        <h4 className="text-md font-medium border-b border-gray-200 pb-1">
          {getDisplayName()}
        </h4>
      </div>
    );
  }

  // デフォルトはテキスト入力
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {getDisplayName()}
      </Label>
      <Input
        id={name}
        type="text"
        value={internalValue}
        onChange={(e) => handleValueChange(e.target.value)}
      />
    </div>
  );
}