import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ParameterInput } from "@/components/ui/parameter-input";
import { useToast } from "@/hooks/use-toast";
import { EFFECTS, TRACK_A_EFFECTS, getEffectParameters, BANKS, SLOTS, EFFECT_RECORDING_TYPE_LABELS } from "@/lib/effects";
import { getAppropriateEffectOptions } from "@/lib/effect-utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  EffectRecordingType,
  BankType,
  SlotType,
  FxGroup,
  SwitchMode,
  InsertType,
} from "@shared/schema";
import {
  EffectGrid,
  EffectConfig,
  createEmptyEffectGrid,
  getEffect,
  setEffect,
  filterEnabledEffects,
  convertLegacyEffectsToGrid,
  getEnabledBanks,
  getEnabledSlots,
} from "@/lib/effect-grid";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { LoginModal } from "@/components/auth/login-modal";

export default function PresetCreate() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const locationState = window.history.state?.state?.preset;
  const sourcePreset = locationState || null;

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [presetName, setPresetName] = useState(
    sourcePreset ? `${sourcePreset.name} (コピー)` : "",
  );
  const [presetTags, setPresetTags] = useState(
    sourcePreset
      ? sourcePreset.tags
          .map((tag: { id: number; name: string }) => tag.name)
          .join(", ")
      : "",
  );
  const [effectRecordingType, setEffectRecordingType] = useState<EffectRecordingType>(
    sourcePreset?.effectRecordingType || "ALL_32"
  );

  // Auto-determine preset type from effect recording type
  const presetType = (() => {
    switch (effectRecordingType) {
      case "ALL_32":
        return "INPUT_TRACK_FX";
      case "INPUT_16":
        return "INPUT_FX";
      case "TRACK_16":
        return "TRACK_FX";
      case "FX4":
        return "INPUT_TRACK_FX";
      default:
        return "INPUT_TRACK_FX";
    }
  })();

  const [effectGrid, setEffectGrid] = useState<EffectGrid>(() => {
    if (sourcePreset && sourcePreset.effects && sourcePreset.effects.length > 0) {
      return convertLegacyEffectsToGrid(sourcePreset.effects);
    }
    return createEmptyEffectGrid();
  });

  const [currentFxGroup, setCurrentFxGroup] = useState<FxGroup>("input");
  const [currentBank, setCurrentBank] = useState<BankType>("A");
  const [currentSlot, setCurrentSlot] = useState<SlotType>("A");

  const currentEffect = getEffect(effectGrid, currentFxGroup, currentBank, currentSlot);

  const enabledBanks = getEnabledBanks(effectRecordingType, currentFxGroup);
  const enabledSlots = getEnabledSlots(effectRecordingType);

  useEffect(() => {
    if (enabledBanks.length > 0 && !enabledBanks.includes(currentBank)) {
      setCurrentBank(enabledBanks[0]);
    }
  }, [effectRecordingType, currentFxGroup, enabledBanks, currentBank]);

  useEffect(() => {
    if (enabledSlots.length > 0 && !enabledSlots.includes(currentSlot)) {
      setCurrentSlot(enabledSlots[0]);
    }
  }, [effectRecordingType, enabledSlots, currentSlot]);

  const updateCurrentEffect = (updates: Partial<EffectConfig>) => {
    if (!currentEffect) return;
    
    const updatedEffect = { ...currentEffect, ...updates };
    setEffectGrid(setEffect(effectGrid, currentFxGroup, currentBank, currentSlot, updatedEffect));
  };

  const updateEffectType = (newEffectType: string) => {
    if (!currentEffect) return;

    const parameters = getEffectParameters(newEffectType);
    const defaultParams: Record<string, any> = {};
    parameters.forEach((param) => {
      defaultParams[param.name] = param.defaultValue;
    });

    updateCurrentEffect({
      effectType: newEffectType,
      parameters: defaultParams,
    });
  };

  const updateParameter = (paramName: string, value: any) => {
    if (!currentEffect) return;
    
    updateCurrentEffect({
      parameters: {
        ...currentEffect.parameters,
        [paramName]: value,
      },
    });
  };

  const createPresetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "プリセットの作成に失敗しました");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "プリセットを作成しました",
        description: "プリセットが正常に保存されました。",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      navigate("/presets");
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "プリセットの作成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    const effectsArray = filterEnabledEffects(effectGrid, effectRecordingType).map(effect => ({
      fxGroup: effect.fxGroup,
      bank: effect.bank,
      slot: effect.slot,
      effectType: effect.effectType,
      sw: effect.sw,
      swMode: effect.swMode,
      insert: effect.insert,
      parameters: effect.parameters,
    }));

    const tagArray = presetTags
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);

    createPresetMutation.mutate({
      name: presetName,
      type: presetType,
      effectRecordingType,
      tags: tagArray,
      effects: effectsArray,
    });
  };

  const effectOptions = currentEffect 
    ? getAppropriateEffectOptions(
        presetType as any,
        currentSlot
      )
    : [];

  const effectParameters = currentEffect ? getEffectParameters(currentEffect.effectType) : [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          handleSubmit(new Event('submit') as any);
        }}
      />
      
      <div className="mb-6">
        <Link href="/presets">
          <Button variant="ghost" size="sm" className="mb-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">プリセット作成</h1>
        <p className="text-muted-foreground mt-2">
          RC505mk2のエフェクトプリセットを作成します
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card data-testid="card-basic-info">
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="preset-name" data-testid="label-preset-name">
                プリセット名 *
              </Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="プリセット名を入力"
                required
                data-testid="input-preset-name"
              />
            </div>

            <div>
              <Label htmlFor="preset-tags" data-testid="label-tags">
                タグ（カンマ区切り）
              </Label>
              <Input
                id="preset-tags"
                value={presetTags}
                onChange={(e) => setPresetTags(e.target.value)}
                placeholder="例: ボーカル, リバーブ, ディレイ"
                data-testid="input-tags"
              />
            </div>

            <div>
              <Label data-testid="label-recording-type">エフェクト記録形式 *</Label>
              <Select
                value={effectRecordingType}
                onValueChange={(value) => setEffectRecordingType(value as EffectRecordingType)}
              >
                <SelectTrigger data-testid="select-recording-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_32" data-testid="option-all-32">
                    {EFFECT_RECORDING_TYPE_LABELS.ALL_32}
                  </SelectItem>
                  <SelectItem value="INPUT_16" data-testid="option-input-16">
                    {EFFECT_RECORDING_TYPE_LABELS.INPUT_16}
                  </SelectItem>
                  <SelectItem value="TRACK_16" data-testid="option-track-16">
                    {EFFECT_RECORDING_TYPE_LABELS.TRACK_16}
                  </SelectItem>
                  <SelectItem value="FX4" data-testid="option-fx4">
                    {EFFECT_RECORDING_TYPE_LABELS.FX4}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                保存するエフェクトスロットの範囲を選択します
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-effects">
          <CardHeader>
            <CardTitle>エフェクト設定</CardTitle>
            <CardDescription>
              3層のタブでエフェクトスロットを選択し、各スロットのエフェクトを設定します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentFxGroup} onValueChange={(v) => setCurrentFxGroup(v as FxGroup)}>
              <TabsList className="grid w-full grid-cols-2" data-testid="tabs-fx-group">
                <TabsTrigger value="input" data-testid="tab-input-fx">
                  INPUT FX
                </TabsTrigger>
                <TabsTrigger value="track" data-testid="tab-track-fx">
                  TRACK FX
                </TabsTrigger>
              </TabsList>

              <TabsContent value="input" className="mt-4">
                <Tabs value={currentBank} onValueChange={(v) => setCurrentBank(v as BankType)}>
                  <TabsList className="grid w-full grid-cols-4 mb-4" data-testid="tabs-bank">
                    {BANKS.map((bank) => (
                      <TabsTrigger
                        key={bank}
                        value={bank}
                        disabled={!enabledBanks.includes(bank)}
                        data-testid={`tab-bank-${bank}`}
                      >
                        Bank {bank}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {BANKS.map((bank) => (
                    <TabsContent key={bank} value={bank}>
                      <div className="flex gap-2 mb-4" data-testid="slots-selector">
                        {SLOTS.map((slot) => (
                          <Button
                            key={slot}
                            type="button"
                            variant={currentSlot === slot ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentSlot(slot)}
                            disabled={!enabledSlots.includes(slot)}
                            data-testid={`button-slot-${slot}`}
                          >
                            FX {slot}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>

              <TabsContent value="track" className="mt-4">
                <Tabs value={currentBank} onValueChange={(v) => setCurrentBank(v as BankType)}>
                  <TabsList className="grid w-full grid-cols-4 mb-4" data-testid="tabs-bank">
                    {BANKS.map((bank) => (
                      <TabsTrigger
                        key={bank}
                        value={bank}
                        disabled={!enabledBanks.includes(bank)}
                        data-testid={`tab-bank-${bank}`}
                      >
                        Bank {bank}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {BANKS.map((bank) => (
                    <TabsContent key={bank} value={bank}>
                      <div className="flex gap-2 mb-4" data-testid="slots-selector">
                        {SLOTS.map((slot) => (
                          <Button
                            key={slot}
                            type="button"
                            variant={currentSlot === slot ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentSlot(slot)}
                            disabled={!enabledSlots.includes(slot)}
                            data-testid={`button-slot-${slot}`}
                          >
                            FX {slot}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>
            </Tabs>

            {currentEffect && (
              <Card className="mt-4" data-testid="card-effect-config">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentFxGroup === "input" ? "INPUT" : "TRACK"} FX - Bank {currentBank} - FX {currentSlot}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="effect-sw" data-testid="label-effect-sw">
                      エフェクトON/OFF
                    </Label>
                    <Switch
                      id="effect-sw"
                      checked={currentEffect.sw}
                      onCheckedChange={(checked) => updateCurrentEffect({ sw: checked })}
                      data-testid="switch-effect-sw"
                    />
                  </div>

                  <div>
                    <Label htmlFor="effect-type" data-testid="label-effect-type">
                      エフェクトタイプ
                    </Label>
                    <Select
                      value={currentEffect.effectType}
                      onValueChange={updateEffectType}
                    >
                      <SelectTrigger id="effect-type" data-testid="select-effect-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {effectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} data-testid={`option-${option.value}`}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="switch-mode" data-testid="label-switch-mode">
                      スイッチモード
                    </Label>
                    <Select
                      value={currentEffect.swMode}
                      onValueChange={(value) => updateCurrentEffect({ swMode: value as SwitchMode })}
                    >
                      <SelectTrigger id="switch-mode" data-testid="select-switch-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TOGGLE" data-testid="option-toggle">TOGGLE</SelectItem>
                        <SelectItem value="MOMENT" data-testid="option-moment">MOMENT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="insert-type" data-testid="label-insert-type">
                      インサートタイプ
                    </Label>
                    <Select
                      value={currentEffect.insert}
                      onValueChange={(value) => updateCurrentEffect({ insert: value as InsertType })}
                    >
                      <SelectTrigger id="insert-type" data-testid="select-insert-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" data-testid="option-all">ALL</SelectItem>
                        <SelectItem value="MIC1" data-testid="option-mic1">MIC1</SelectItem>
                        <SelectItem value="MIC2" data-testid="option-mic2">MIC2</SelectItem>
                        <SelectItem value="INST1" data-testid="option-inst1">INST1</SelectItem>
                        <SelectItem value="INST2" data-testid="option-inst2">INST2</SelectItem>
                        <SelectItem value="TRACK1" data-testid="option-track1">TRACK1</SelectItem>
                        <SelectItem value="TRACK2" data-testid="option-track2">TRACK2</SelectItem>
                        <SelectItem value="TRACK3" data-testid="option-track3">TRACK3</SelectItem>
                        <SelectItem value="TRACK4" data-testid="option-track4">TRACK4</SelectItem>
                        <SelectItem value="TRACK5" data-testid="option-track5">TRACK5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {effectParameters.length > 0 && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between"
                          type="button"
                          data-testid="button-toggle-parameters"
                        >
                          <span>パラメータ設定 ({effectParameters.length}個)</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 mt-4">
                        {effectParameters.map((param) => (
                          <div key={param.name}>
                            <Label htmlFor={param.name} data-testid={`label-${param.name}`}>
                              {param.display_name || param.name}
                            </Label>
                            <ParameterInput
                              name={param.name}
                              config={param}
                              value={currentEffect.parameters[param.name]}
                              onChange={(name, value) => updateParameter(name, value)}
                            />
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={!presetName || createPresetMutation.isPending}
            className="flex-1"
            data-testid="button-submit"
          >
            {createPresetMutation.isPending ? "作成中..." : "プリセットを作成"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/presets")}
            data-testid="button-cancel"
          >
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
