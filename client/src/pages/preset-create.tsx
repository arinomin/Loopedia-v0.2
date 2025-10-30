import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { EFFECTS, TRACK_A_EFFECTS, getEffectParameters } from "@/lib/effects";
import { getAppropriateEffectOptions } from "@/lib/effect-utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  EffectType,
  EffectPosition,
  ExtendedEffectPosition,
  SwitchMode,
  InsertType,
} from "@shared/schema";
import { ChevronDown } from "lucide-react";
import { LoginModal } from "@/components/auth/login-modal";
import { ArrowLeft } from "lucide-react";

// エフェクト設定の型定義
interface EffectConfig {
  position: EffectPosition | ExtendedEffectPosition;
  effectType: string;
  sw: boolean;
  swMode: SwitchMode;
  insert: InsertType;
  parameters: Record<string, any>;
}

// 初期エフェクト設定
const INITIAL_EFFECT_CONFIG: EffectConfig = {
  position: "A",
  effectType: "LPF",
  sw: true,
  swMode: "TOGGLE",
  insert: "ALL",
  parameters: {},
};

export default function PresetCreate() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // 編集用のプリセットデータが渡されているか確認
  const locationState = window.history.state?.state?.preset;
  const sourcePreset = locationState || null;

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // ログインモーダルの状態
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // State for preset data
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
  const [fxType, setFxType] = useState<EffectType>(
    sourcePreset ? sourcePreset.type : "INPUT_FX",
  );
  
  // タブ状態管理（単一変数で管理）
  const [currentTab, setCurrentTab] = useState<EffectPosition>("A");

  // 初期エフェクト設定
  const initialEffects: Record<EffectPosition, EffectConfig> = {
    A: { ...INITIAL_EFFECT_CONFIG, position: "A", effectType: "LPF" },
    B: { ...INITIAL_EFFECT_CONFIG, position: "B", effectType: "LPF" },
    C: { ...INITIAL_EFFECT_CONFIG, position: "C", effectType: "LPF" },
    D: { ...INITIAL_EFFECT_CONFIG, position: "D", effectType: "LPF" },
  };
  
  // INPUT_TRACK_FX用の初期エフェクト設定
  const initialInputEffects: Record<EffectPosition, EffectConfig> = {
    A: { ...INITIAL_EFFECT_CONFIG, position: "INPUT_A", effectType: "LPF" },
    B: { ...INITIAL_EFFECT_CONFIG, position: "INPUT_B", effectType: "LPF" },
    C: { ...INITIAL_EFFECT_CONFIG, position: "INPUT_C", effectType: "LPF" },
    D: { ...INITIAL_EFFECT_CONFIG, position: "INPUT_D", effectType: "LPF" },
  };
  
  const initialTrackEffects: Record<EffectPosition, EffectConfig> = {
    A: { ...INITIAL_EFFECT_CONFIG, position: "TRACK_A", effectType: "LPF" },
    B: { ...INITIAL_EFFECT_CONFIG, position: "TRACK_B", effectType: "LPF" },
    C: { ...INITIAL_EFFECT_CONFIG, position: "TRACK_C", effectType: "LPF" },
    D: { ...INITIAL_EFFECT_CONFIG, position: "TRACK_D", effectType: "LPF" },
  };

  // 通常のエフェクト設定
  const [effects, setEffects] = useState<Record<EffectPosition, EffectConfig>>(
    () => {
      if (!sourcePreset || !sourcePreset.effects) {
        return initialEffects;
      }

      const sourceEffects = { ...initialEffects };

      sourcePreset.effects.forEach((effect: any) => {
        if (effect.position && ["A", "B", "C", "D"].includes(effect.position)) {
          // パラメータがJSON文字列の場合はパースする
          let parsedParameters = {};

          try {
            if (effect.parameters) {
              if (typeof effect.parameters === "string") {
                parsedParameters = JSON.parse(effect.parameters);
              } else {
                parsedParameters = effect.parameters;
              }
            }
          } catch (err) {
            console.error("パラメータのパースに失敗:", err);
          }

          sourceEffects[effect.position as EffectPosition] = {
            position: effect.position as EffectPosition,
            effectType: effect.effectType || "LPF",
            sw: effect.sw !== undefined ? effect.sw : true,
            swMode: effect.swMode || "TOGGLE",
            insert: effect.insert || "ALL",
            parameters: parsedParameters,
          };
        }
      });

      return sourceEffects;
    },
  );

  // INPUTエフェクト設定
  const [inputEffects, setInputEffects] = useState<Record<EffectPosition, EffectConfig>>(initialInputEffects);
  
  // TRACKエフェクト設定
  const [trackEffects, setTrackEffects] = useState<Record<EffectPosition, EffectConfig>>(initialTrackEffects);

  // 初期化時にすべてのエフェクトのパラメータを設定
  useEffect(() => {
    // 通常のエフェクト設定を初期化
    const initializedEffects = { ...effects };
    Object.keys(initializedEffects).forEach((position) => {
      const effect = initializedEffects[position as EffectPosition];
      const parameters = getEffectParameters(effect.effectType);
      const defaultParams: Record<string, any> = {};
      parameters.forEach((param) => {
        defaultParams[param.name] = param.defaultValue;
      });
      initializedEffects[position as EffectPosition].parameters = {
        ...defaultParams,
        ...effect.parameters,
      };
    });
    setEffects(initializedEffects);
    
    // INPUT用エフェクト設定を初期化
    const initializedInputEffects = { ...inputEffects };
    Object.keys(initializedInputEffects).forEach((position) => {
      const effect = initializedInputEffects[position as EffectPosition];
      const parameters = getEffectParameters(effect.effectType);
      const defaultParams: Record<string, any> = {};
      parameters.forEach((param) => {
        defaultParams[param.name] = param.defaultValue;
      });
      initializedInputEffects[position as EffectPosition].parameters = {
        ...defaultParams,
        ...effect.parameters,
      };
    });
    setInputEffects(initializedInputEffects);
    
    // TRACK用エフェクト設定を初期化
    const initializedTrackEffects = { ...trackEffects };
    Object.keys(initializedTrackEffects).forEach((position) => {
      const effect = initializedTrackEffects[position as EffectPosition];
      const parameters = getEffectParameters(effect.effectType);
      const defaultParams: Record<string, any> = {};
      parameters.forEach((param) => {
        defaultParams[param.name] = param.defaultValue;
      });
      initializedTrackEffects[position as EffectPosition].parameters = {
        ...defaultParams,
        ...effect.parameters,
      };
    });
    setTrackEffects(initializedTrackEffects);
  }, []);

  // プリセット保存のmutation
  const createPresetMutation = useMutation({
    mutationFn: async (data: any) => {
      return fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      }).then(res => {
        if (!res.ok) throw new Error("Failed to create preset");
        return res.json();
      });
    },
    onSuccess: () => {
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
    },
    onError: (error) => {
      console.error("Create preset error:", error);
    },
  });

  // FXの更新関数
  const updateEffect = (
    position: EffectPosition,
    updates: Partial<EffectConfig>,
  ) => {
    setEffects((prev) => ({
      ...prev,
      [position]: {
        ...prev[position],
        ...updates,
      },
    }));
  };
  
  // INPUT FXの更新関数
  const updateInputEffect = (
    position: EffectPosition,
    updates: Partial<EffectConfig>,
  ) => {
    setInputEffects((prev) => ({
      ...prev,
      [position]: {
        ...prev[position],
        ...updates,
      },
    }));
  };
  
  // TRACK FXの更新関数
  const updateTrackEffect = (
    position: EffectPosition,
    updates: Partial<EffectConfig>,
  ) => {
    setTrackEffects((prev) => ({
      ...prev,
      [position]: {
        ...prev[position],
        ...updates,
      },
    }));
  };

  // 通常モードでのエフェクトタイプ変更処理
  const handleEffectTypeChange = (position: EffectPosition, value: string) => {
    const effect = effects[position];
    if (value === effect.effectType) return;

    const parameters = getEffectParameters(value);
    const defaultParams: Record<string, any> = {};
    parameters.forEach((param) => {
      defaultParams[param.name] = param.defaultValue;
    });

    updateEffect(position, {
      effectType: value,
      parameters: defaultParams,
    });
  };

  // INPUT FXのエフェクトタイプ変更処理
  const handleInputEffectTypeChange = (position: EffectPosition, value: string) => {
    const effect = inputEffects[position];
    if (value === effect.effectType) return;

    const parameters = getEffectParameters(value);
    const defaultParams: Record<string, any> = {};
    parameters.forEach((param) => {
      defaultParams[param.name] = param.defaultValue;
    });

    updateInputEffect(position, {
      effectType: value,
      parameters: defaultParams,
    });
  };

  // TRACK FXのエフェクトタイプ変更処理
  const handleTrackEffectTypeChange = (position: EffectPosition, value: string) => {
    const effect = trackEffects[position];
    if (value === effect.effectType) return;

    const parameters = getEffectParameters(value);
    const defaultParams: Record<string, any> = {};
    parameters.forEach((param) => {
      defaultParams[param.name] = param.defaultValue;
    });

    updateTrackEffect(position, {
      effectType: value,
      parameters: defaultParams,
    });
  };

  // プリセットのバリデーション
  const validatePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "エラー",
        description: "プリセット名を入力してください",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // ログイン成功後にプリセットを保存する
  const savePresetAfterLogin = () => {
    if (!validatePreset()) return;

    // Process tags
    const tags = presetTags
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag !== "");

    // Prepare effects data
    let configuredEffects;
    
    if (fxType === "INPUT_TRACK_FX") {
      // INPUT側のエフェクト
      const inputConfiguredEffects = Object.values(inputEffects).filter(
        (effect) => effect.effectType !== "none",
      );
      
      // TRACK側のエフェクト
      const trackConfiguredEffects = Object.values(trackEffects).filter(
        (effect) => effect.effectType !== "none",
      );
      
      // 両方を結合
      configuredEffects = [...inputConfiguredEffects, ...trackConfiguredEffects];
    } else {
      // 通常のエフェクト
      configuredEffects = Object.values(effects).filter(
        (effect) => effect.effectType !== "none",
      );
    }

    // パラメータをJSON文字列に変換
    const effectsData = configuredEffects.map((effect) => {
      let processedParameters;
      
      try {
        if (typeof effect.parameters === 'string') {
          const parsedParams = JSON.parse(effect.parameters);
          processedParameters = JSON.stringify(parsedParams);
        } else {
          if (effect.parameters === null || effect.parameters === undefined) {
            processedParameters = "{}";
          } else {
            processedParameters = JSON.stringify(effect.parameters);
          }
        }
      } catch (e) {
        console.error("パラメータ処理エラー:", {
          position: effect.position,
          parameters: effect.parameters,
          error: e
        });
        processedParameters = "{}";
      }
      
      return {
        ...effect,
        parameters: processedParameters,
      };
    });

    // プリセットを保存
    try {
      createPresetMutation.mutate({
        name: presetName,
        type: fxType,
        effects: effectsData,
        tags,
      }, {
        onSuccess: () => {
          toast({
            title: "プリセット保存完了",
            description: `プリセット "${presetName}" を保存しました`,
            variant: "default",
          });
          navigate("/");
        },
        onError: (error: any) => {
          console.error("プリセット保存エラー:", error);
          toast({
            title: "エラー",
            description: "プリセットの保存に失敗しました",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("プリセット保存エラー:", error);
      toast({
        title: "エラー",
        description: "プリセットの保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  // フォーム送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 未ログインの場合はログインモーダルを表示
    if (!currentUser) {
      if (validatePreset()) {
        setIsLoginModalOpen(true);
      }
      return;
    }

    // ログイン済みの場合はそのまま保存
    savePresetAfterLogin();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* ログインモーダル */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={savePresetAfterLogin}
        title="ログインが必要です"
        description="プリセットを保存するにはログインまたは新規登録が必要です。"
      />

      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            プリセット作成
          </CardTitle>
          <CardDescription>
            RC-505mk2用のプリセットを作成します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <Label htmlFor="preset-name">プリセット名</Label>
                <div className="mt-1">
                  <Input
                    id="preset-name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <Label htmlFor="preset-tags">タグ（カンマ区切り）</Label>
                <div className="mt-1">
                  <Input
                    id="preset-tags"
                    placeholder="例: ボーカル, ハーモニー, ライブ"
                    value={presetTags}
                    onChange={(e) => setPresetTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <Label>FXタイプ</Label>
                <div className="mt-1">
                  <RadioGroup
                    value={fxType}
                    onValueChange={(value) => {
                      const newFxType = value as EffectType;
                      setFxType(newFxType);
                    }}
                    className="flex space-x-6 flex-wrap"
                  >
                    <div className="flex items-center space-x-2 mr-4 mb-2">
                      <RadioGroupItem value="INPUT_FX" id="input-fx" />
                      <Label htmlFor="input-fx">INPUT FX</Label>
                    </div>
                    <div className="flex items-center space-x-2 mr-4 mb-2">
                      <RadioGroupItem value="TRACK_FX" id="track-fx" />
                      <Label htmlFor="track-fx">TRACK FX</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="INPUT_TRACK_FX" id="input-track-fx" />
                      <Label htmlFor="input-track-fx">INPUT FX & TRACK FX</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Effect Tabs */}
            <div className="mt-8">
              {fxType === "INPUT_TRACK_FX" ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">INPUT FXとTRACK FXの設定</h3>
                  
                  {/* 全8タブを横並びに配置 */}
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <Tabs defaultValue="INPUT_A">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* INPUT FX グループ */}
                        <div className="bg-card p-4 rounded-lg shadow-sm">
                          <h3 className="text-primary font-semibold mb-4 pb-2 border-b">INPUT FX</h3>
                          <TabsList className="justify-start w-full">
                            <TabsTrigger className="flex-1" value="INPUT_A">FX A</TabsTrigger>
                            <TabsTrigger className="flex-1" value="INPUT_B">FX B</TabsTrigger>
                            <TabsTrigger className="flex-1" value="INPUT_C">FX C</TabsTrigger>
                            <TabsTrigger className="flex-1" value="INPUT_D">FX D</TabsTrigger>
                          </TabsList>
                        </div>
                        
                        {/* TRACK FX グループ */}
                        <div className="bg-card p-4 rounded-lg shadow-sm">
                          <h3 className="text-primary font-semibold mb-4 pb-2 border-b">TRACK FX</h3>
                          <TabsList className="justify-start w-full">
                            <TabsTrigger className="flex-1" value="TRACK_A">FX A</TabsTrigger>
                            <TabsTrigger className="flex-1" value="TRACK_B">FX B</TabsTrigger>
                            <TabsTrigger className="flex-1" value="TRACK_C">FX C</TabsTrigger>
                            <TabsTrigger className="flex-1" value="TRACK_D">FX D</TabsTrigger>
                          </TabsList>
                        </div>
                      </div>

                      {/* INPUT FX タブコンテンツ */}
                      {["A", "B", "C", "D"].map((position) => (
                        <TabsContent key={`INPUT_${position}`} value={`INPUT_${position}`}>
                          <div className="space-y-6">
                            {/* エフェクトコントロールパネル */}
                            <Collapsible className="bg-muted p-4 rounded-md mb-6">
                              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                                <h4 className="text-md font-medium">INPUT FX {position} - エフェクト設定</h4>
                                <ChevronDown className="h-6 w-6 transition-transform duration-200 text-primary group-data-[state=open]:rotate-180" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                  <div>
                                    <Label className="mb-2">SW</Label>
                                    <div className="flex items-center">
                                      <Switch
                                        checked={inputEffects[position as EffectPosition].sw}
                                        onCheckedChange={(checked) =>
                                          updateInputEffect(position as EffectPosition, {
                                            sw: checked,
                                          })
                                        }
                                      />
                                      <span className="ml-2 text-sm text-muted-foreground">
                                        {inputEffects[position as EffectPosition].sw ? "ON" : "OFF"}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="mb-2">SW MODE</Label>
                                    <div className="flex space-x-4">
                                      <RadioGroup
                                        value={inputEffects[position as EffectPosition].swMode}
                                        onValueChange={(value) =>
                                          updateInputEffect(position as EffectPosition, {
                                            swMode: value as SwitchMode,
                                          })
                                        }
                                        className="flex space-x-4"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem
                                            value="TOGGLE"
                                            id={`input-toggle-${position}`}
                                          />
                                          <Label htmlFor={`input-toggle-${position}`}>
                                            TOGGLE
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem
                                            value="MOMENT"
                                            id={`input-moment-${position}`}
                                          />
                                          <Label htmlFor={`input-moment-${position}`}>
                                            MOMENT
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="mb-2">INSERT</Label>
                                    <Select
                                      value={inputEffects[position as EffectPosition].insert}
                                      onValueChange={(value) =>
                                        updateInputEffect(position as EffectPosition, {
                                          insert: value as InsertType,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Insert" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ALL">ALL</SelectItem>
                                        <SelectItem value="MIC1">MIC1</SelectItem>
                                        <SelectItem value="MIC2">MIC2</SelectItem>
                                        <SelectItem value="INST1">INST1</SelectItem>
                                        <SelectItem value="INST2">INST2</SelectItem>
                                        <SelectItem value="TRACK1">TRACK1</SelectItem>
                                        <SelectItem value="TRACK2">TRACK2</SelectItem>
                                        <SelectItem value="TRACK3">TRACK3</SelectItem>
                                        <SelectItem value="TRACK4">TRACK4</SelectItem>
                                        <SelectItem value="TRACK5">TRACK5</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* パラメータカード表示 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              {/* エフェクトタイプカード（左上） */}
                              <div className="bg-muted p-4 rounded-md">
                                <h4 className="font-medium mb-3">エフェクトタイプ</h4>
                                <div>
                                  <Select
                                    value={inputEffects[position as EffectPosition].effectType}
                                    onValueChange={(value) => handleInputEffectTypeChange(position as EffectPosition, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="エフェクトを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAppropriateEffectOptions("INPUT_FX", position as EffectPosition).map((effect) => (
                                        <SelectItem key={effect.value} value={effect.value}>
                                          {effect.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* パラメータカード */}
                              {getEffectParameters(
                                inputEffects[position as EffectPosition].effectType
                              ).map((param) => (
                                <div key={param.name} className="bg-muted p-4 rounded-md">
                                  <h4 className="font-medium mb-3">{param.name.split("_").pop()}</h4>
                                  <ParameterInput
                                    name={param.name}
                                    config={param}
                                    value={
                                      inputEffects[position as EffectPosition].parameters[
                                        param.name
                                      ]
                                    }
                                    onChange={(name, value) => {
                                      const updatedParams = {
                                        ...inputEffects[position as EffectPosition].parameters,
                                        [name]: value,
                                      };
                                      updateInputEffect(position as EffectPosition, {
                                        parameters: updatedParams,
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      ))}

                      {/* TRACK FX タブコンテンツ */}
                      {["A", "B", "C", "D"].map((position) => (
                        <TabsContent key={`TRACK_${position}`} value={`TRACK_${position}`}>
                          <div className="space-y-6">
                            {/* エフェクトコントロールパネル */}
                            <Collapsible className="bg-muted p-4 rounded-md mb-6">
                              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                                <h4 className="text-md font-medium">TRACK FX {position} - エフェクト設定</h4>
                                <ChevronDown className="h-6 w-6 transition-transform duration-200 text-primary group-data-[state=open]:rotate-180" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                  <div>
                                    <Label className="mb-2">SW</Label>
                                    <div className="flex items-center">
                                      <Switch
                                        checked={trackEffects[position as EffectPosition].sw}
                                        onCheckedChange={(checked) =>
                                          updateTrackEffect(position as EffectPosition, {
                                            sw: checked,
                                          })
                                        }
                                      />
                                      <span className="ml-2 text-sm text-muted-foreground">
                                        {trackEffects[position as EffectPosition].sw ? "ON" : "OFF"}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="mb-2">SW MODE</Label>
                                    <div className="flex space-x-4">
                                      <RadioGroup
                                        value={trackEffects[position as EffectPosition].swMode}
                                        onValueChange={(value) =>
                                          updateTrackEffect(position as EffectPosition, {
                                            swMode: value as SwitchMode,
                                          })
                                        }
                                        className="flex space-x-4"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem
                                            value="TOGGLE"
                                            id={`track-toggle-${position}`}
                                          />
                                          <Label htmlFor={`track-toggle-${position}`}>
                                            TOGGLE
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem
                                            value="MOMENT"
                                            id={`track-moment-${position}`}
                                          />
                                          <Label htmlFor={`track-moment-${position}`}>
                                            MOMENT
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="mb-2">INSERT</Label>
                                    <Select
                                      value={trackEffects[position as EffectPosition].insert}
                                      onValueChange={(value) =>
                                        updateTrackEffect(position as EffectPosition, {
                                          insert: value as InsertType,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Insert" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ALL">ALL</SelectItem>
                                        <SelectItem value="MIC1">MIC1</SelectItem>
                                        <SelectItem value="MIC2">MIC2</SelectItem>
                                        <SelectItem value="INST1">INST1</SelectItem>
                                        <SelectItem value="INST2">INST2</SelectItem>
                                        <SelectItem value="TRACK1">TRACK1</SelectItem>
                                        <SelectItem value="TRACK2">TRACK2</SelectItem>
                                        <SelectItem value="TRACK3">TRACK3</SelectItem>
                                        <SelectItem value="TRACK4">TRACK4</SelectItem>
                                        <SelectItem value="TRACK5">TRACK5</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* パラメータカード表示 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              {/* エフェクトタイプカード（左上） */}
                              <div className="bg-muted p-4 rounded-md">
                                <h4 className="font-medium mb-3">エフェクトタイプ</h4>
                                <div>
                                  <Select
                                    value={trackEffects[position as EffectPosition].effectType}
                                    onValueChange={(value) => handleTrackEffectTypeChange(position as EffectPosition, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="エフェクトを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAppropriateEffectOptions("TRACK_FX", position as EffectPosition).map((effect) => (
                                        <SelectItem key={effect.value} value={effect.value}>
                                          {effect.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* パラメータカード */}
                              {getEffectParameters(
                                trackEffects[position as EffectPosition].effectType
                              ).map((param) => (
                                <div key={param.name} className="bg-muted p-4 rounded-md">
                                  <h4 className="font-medium mb-3">{param.name.split("_").pop()}</h4>
                                  <ParameterInput
                                    name={param.name}
                                    config={param}
                                    value={
                                      trackEffects[position as EffectPosition].parameters[
                                        param.name
                                      ]
                                    }
                                    onChange={(name, value) => {
                                      const updatedParams = {
                                        ...trackEffects[position as EffectPosition].parameters,
                                        [name]: value,
                                      };
                                      updateTrackEffect(position as EffectPosition, {
                                        parameters: updatedParams,
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </div>
              ) : (
                // 通常のINPUT FXまたはTRACK FX選択時のUI（既存のものを維持）
                <Tabs defaultValue="A" onValueChange={(value) => setCurrentTab(value as EffectPosition)}>
                  <TabsList className="mb-6">
                    <TabsTrigger className="min-w-16" value="A">FX A</TabsTrigger>
                    <TabsTrigger className="min-w-16" value="B">FX B</TabsTrigger>
                    <TabsTrigger className="min-w-16" value="C">FX C</TabsTrigger>
                    <TabsTrigger className="min-w-16" value="D">FX D</TabsTrigger>
                  </TabsList>

                  {["A", "B", "C", "D"].map((position) => (
                    <TabsContent key={position} value={position} className="mt-4">
                      {/* エフェクトコントロールパネル */}
                      <Collapsible className="bg-muted p-4 rounded-md mb-6">
                        <CollapsibleTrigger className="flex items-center justify-between w-full group">
                          <h4 className="text-md font-medium">エフェクト設定</h4>
                          <ChevronDown className="h-6 w-6 transition-transform duration-200 text-primary group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                              <Label className="mb-2">SW</Label>
                              <div className="flex items-center">
                                <Switch
                                  checked={effects[position as EffectPosition].sw}
                                  onCheckedChange={(checked) =>
                                    updateEffect(position as EffectPosition, {
                                      sw: checked,
                                    })
                                  }
                                />
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {effects[position as EffectPosition].sw
                                    ? "ON"
                                    : "OFF"}
                                </span>
                              </div>
                            </div>

                            <div>
                              <Label className="mb-2">SW MODE</Label>
                              <div className="flex space-x-4">
                                <RadioGroup
                                  value={
                                    effects[position as EffectPosition].swMode
                                  }
                                  onValueChange={(value) =>
                                    updateEffect(position as EffectPosition, {
                                      swMode: value as SwitchMode,
                                    })
                                  }
                                  className="flex space-x-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="TOGGLE"
                                      id={`toggle-${position}`}
                                    />
                                    <Label htmlFor={`toggle-${position}`}>
                                      TOGGLE
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="MOMENT"
                                      id={`moment-${position}`}
                                    />
                                    <Label htmlFor={`moment-${position}`}>
                                      MOMENT
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            </div>

                            <div>
                              <Label className="mb-2">INSERT</Label>
                              <Select
                                value={effects[position as EffectPosition].insert}
                                onValueChange={(value) =>
                                  updateEffect(position as EffectPosition, {
                                    insert: value as InsertType,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Insert" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL">ALL</SelectItem>
                                  <SelectItem value="MIC1">MIC1</SelectItem>
                                  <SelectItem value="MIC2">MIC2</SelectItem>
                                  <SelectItem value="INST1">INST1</SelectItem>
                                  <SelectItem value="INST2">INST2</SelectItem>
                                  <SelectItem value="TRACK1">TRACK1</SelectItem>
                                  <SelectItem value="TRACK2">TRACK2</SelectItem>
                                  <SelectItem value="TRACK3">TRACK3</SelectItem>
                                  <SelectItem value="TRACK4">TRACK4</SelectItem>
                                  <SelectItem value="TRACK5">TRACK5</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* パラメータカード表示 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* エフェクトタイプカード（左上） */}
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-3">エフェクトタイプ</h4>
                          <div>
                            <Select
                              value={effects[position as EffectPosition].effectType}
                              onValueChange={(value) => handleEffectTypeChange(position as EffectPosition, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="エフェクトを選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAppropriateEffectOptions(fxType, position as EffectPosition).map((effect) => (
                                  <SelectItem key={effect.value} value={effect.value}>
                                    {effect.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* パラメータカード */}
                        {getEffectParameters(
                          effects[position as EffectPosition].effectType
                        ).map((param) => (
                          <div key={param.name} className="bg-muted p-4 rounded-md">
                            <h4 className="font-medium mb-3">{param.name.split("_").pop()}</h4>
                            <ParameterInput
                              name={param.name}
                              config={param}
                              value={
                                effects[position as EffectPosition].parameters[
                                  param.name
                                ]
                              }
                              onChange={(name, value) => {
                                const updatedParams = {
                                  ...effects[position as EffectPosition].parameters,
                                  [name]: value,
                                };
                                updateEffect(position as EffectPosition, {
                                  parameters: updatedParams,
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>

            <div className="flex justify-end mt-8 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={!presetName.trim() || createPresetMutation.isPending}
              >
                {createPresetMutation.isPending
                  ? "保存中..."
                  : "プリセットを保存"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}