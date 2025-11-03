import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatDate } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PresetWithDetails, BankType, SlotType, FxGroup } from "@shared/schema";
import { getEffectParameters, BANKS, SLOTS, EFFECT_RECORDING_TYPE_LABELS } from "@/lib/effects";
import { deletePreset, updatePresetName } from "@/lib/api";
import { Share2, Edit, Trash2, ArrowLeft, ChevronDown, Copy } from "lucide-react";
import { UserBadge } from "@/components/user-badge";
import { SocialShare } from "@/components/share/social-share";
import { convertLegacyEffectsToGrid, getEffect, getEnabledBanks, getEnabledSlots, EffectGrid } from "@/lib/effect-grid";

export default function PresetDetail() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const {
    data: preset,
    isLoading,
    error,
  } = useQuery<PresetWithDetails>({
    queryKey: [`/api/presets/${id}`],
  });

  const { data: currentUser } = useQuery<{
    id: number;
    username: string;
    nickname?: string;
  } | null>({
    queryKey: ["/api/auth/me"],
  });

  const [currentFxGroup, setCurrentFxGroup] = useState<FxGroup>("input");
  const [currentBank, setCurrentBank] = useState<BankType>("A");
  const [currentSlot, setCurrentSlot] = useState<SlotType>("A");

  const effectGrid: EffectGrid | null = preset && preset.effects
    ? convertLegacyEffectsToGrid(preset.effects)
    : null;

  const effectRecordingType = (preset?.effectRecordingType || "ALL_32") as import("@shared/schema").EffectRecordingType;
  const enabledBanks = getEnabledBanks(effectRecordingType, currentFxGroup);
  const enabledSlots = getEnabledSlots(effectRecordingType);

  const currentEffect = effectGrid ? getEffect(effectGrid, currentFxGroup, currentBank, currentSlot) : null;

  useEffect(() => {
    if (preset) {
      setNewPresetName(preset.name);
    }
  }, [preset]);

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

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => updatePresetName(parseInt(id), name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${id}`] });
      setIsEditDialogOpen(false);
      toast({
        title: "プリセット更新",
        description: "プリセット名が正常に更新されました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "プリセット名の更新に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePreset(parseInt(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({
        title: "プリセット削除",
        description: "プリセットが正常に削除されました。",
      });
      navigate("/presets");
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "プリセットの削除に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const handleCopyPreset = () => {
    navigate("/preset/create", {
      state: { preset },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (error || !preset) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-red-500">
          プリセットが見つかりませんでした
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === preset.user.id;
  const effectParameters = currentEffect ? getEffectParameters(currentEffect.effectType) : [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <Link href="/presets">
          <Button variant="ghost" size="sm" className="mb-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-preset-name">
              {preset.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserBadge user={preset.user} />
              <span>•</span>
              <span data-testid="text-created-at">{formatDate(preset.createdAt)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-share">
                  <Share2 className="h-4 w-4 mr-2" />
                  共有
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>プリセットを共有</SheetTitle>
                  <SheetDescription>
                    このプリセットを共有するためのリンクやSNSボタンです
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <SocialShare
                    url={window.location.href}
                    title={`${preset.name} - Loopedia`}
                    description={`${preset.user.nickname || preset.user.username}さんのRC505mk2プリセット`}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPreset}
              data-testid="button-copy"
            >
              <Copy className="h-4 w-4 mr-2" />
              コピーして編集
            </Button>

            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  data-testid="button-edit"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  data-testid="button-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card data-testid="card-basic-info">
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">プリセットタイプ</div>
              <Badge variant="secondary" data-testid="badge-preset-type">
                {preset.type}
              </Badge>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">エフェクト記録形式</div>
              <Badge variant="outline" data-testid="badge-recording-type">
                {EFFECT_RECORDING_TYPE_LABELS[effectRecordingType as keyof typeof EFFECT_RECORDING_TYPE_LABELS]}
              </Badge>
            </div>

            {preset.tags && preset.tags.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">タグ</div>
                <div className="flex flex-wrap gap-2">
                  {preset.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" data-testid={`badge-tag-${tag.id}`}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-effects">
          <CardHeader>
            <CardTitle>エフェクト設定</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentFxGroup} onValueChange={(v) => setCurrentFxGroup(v as FxGroup)}>
              <TabsList className="grid w-full grid-cols-2 mb-4" data-testid="tabs-fx-group">
                <TabsTrigger value="input" data-testid="tab-input-fx">
                  INPUT FX
                </TabsTrigger>
                <TabsTrigger value="track" data-testid="tab-track-fx">
                  TRACK FX
                </TabsTrigger>
              </TabsList>

              <TabsContent value="input">
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

              <TabsContent value="track">
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
              <Card className="mt-4" data-testid="card-effect-detail">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentFxGroup === "input" ? "INPUT" : "TRACK"} FX - Bank {currentBank} - FX {currentSlot}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">エフェクトタイプ</div>
                      <div className="font-medium" data-testid="text-effect-type">
                        {currentEffect.effectType}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">ON/OFF</div>
                      <div className="font-medium" data-testid="text-effect-sw">
                        {currentEffect.sw ? "ON" : "OFF"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">スイッチモード</div>
                      <div className="font-medium" data-testid="text-switch-mode">
                        {currentEffect.swMode}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">インサート</div>
                      <div className="font-medium" data-testid="text-insert">
                        {currentEffect.insert}
                      </div>
                    </div>
                  </div>

                  {effectParameters.length > 0 && (
                    <>
                      <Separator />
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between"
                            type="button"
                            data-testid="button-toggle-parameters"
                          >
                            <span>パラメータ ({effectParameters.length}個)</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-4">
                          {effectParameters.map((param) => (
                            <div key={param.name} className="grid grid-cols-2 gap-2">
                              <div className="text-sm text-muted-foreground">
                                {param.display_name || param.name}
                              </div>
                              <div className="text-sm font-medium" data-testid={`text-param-${param.name}`}>
                                {currentEffect.parameters[param.name] !== undefined
                                  ? String(currentEffect.parameters[param.name])
                                  : "未設定"}
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プリセットを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。このプリセットは完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate();
                setIsDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プリセット名を編集</DialogTitle>
            <DialogDescription>
              プリセットの名前を変更します。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="プリセット名"
              data-testid="input-edit-name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              キャンセル
            </Button>
            <Button
              onClick={() => updateNameMutation.mutate(newPresetName)}
              disabled={!newPresetName || updateNameMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateNameMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
