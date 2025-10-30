import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PresetWithDetails } from "@shared/schema";
import { getEffectParameters } from "@/lib/effects";
import { Share2, Edit, Trash2 } from "lucide-react";
import { deletePreset, updatePresetName } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react"; // アイコンをインポート
import { ChevronDown } from "lucide-react"; // アイコンをインポート
import { Copy } from "lucide-react";
import { UserBadge } from "@/components/user-badge";
import { SocialShare } from "@/components/share/social-share";
import DevBadgeImg from "../assets/badges/DevBadge.png";
import LoopBadgeImg from "../assets/badges/LoopBadge.png";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

  useEffect(() => {
    if (preset) {
      setNewPresetName(preset.name);
    }
  }, [preset]);

  // プリセット名更新ミューテーション
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

  // プリセット削除ミューテーション
  const deleteMutation = useMutation({
    mutationFn: () => deletePreset(parseInt(id)),
    onSuccess: () => {
      // プリセット一覧のキャッシュを無効化して強制的に再取得されるようにする
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });

      // 削除成功メッセージを表示
      toast({
        title: "プリセット削除",
        description: "プリセットが正常に削除されました。",
      });

      // プリセット一覧ページへリダイレクト
      navigate("/");
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "プリセットの削除に失敗しました。",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !preset) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-lg font-medium text-red-800">
            プリセットの読み込みに失敗しました
          </h2>
          <p className="mt-2 text-sm text-red-700">
            プリセットが存在しないか、サーバーエラーが発生しました。
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              プリセット一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-6 px-4 sm:px-6 lg:px-8 sm:py-6">
      <div className="mb-2 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          プリセット一覧に戻る
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle className="text-2xl font-semibold">
              {preset.name}
            </CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              {preset.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
          {/* "Copy and Edit" button has been removed as requested */}
        </CardHeader>

        <CardContent>
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col space-y-3">
              {/* ユーザー情報 */}
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                    {(preset.user.nickname || preset.user.username)
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                </div>
                <div>
                  <UserBadge
                    user={preset.user}
                    showUsername={false}
                    size="sm"
                    className="text-foreground"
                  />
                  <span className="text-muted-foreground">
                    {" "}
                    @{preset.user.username}
                  </span>
                  {/* 作成日時を小さく薄く表示 */}
                  <div className="text-xs text-muted-foreground">
                    {formatDate(preset.createdAt)}
                  </div>
                </div>
              </div>

              {/* タイプをタグとして表示 */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 border-gray-200"
                >
                  {preset.type}
                </Badge>
              </div>
            </div>

            {/* その他操作ボタン */}
            <div className="flex items-center mt-4 space-x-2 flex-wrap">
              {/* 共有ボタン */}
              <SocialShare
                title={`RC505mk2プリセット 「${preset.name}」`}
                description={`${preset.user.nickname || preset.user.username}さんが作成したプリセットを見てみよう！`}
                url={`${window.location.origin}/presets/${preset.id}`}
                size="sm"
                variant="ghost"
              />

              {/* 編集ボタン - 自分のプリセットの場合のみ表示 */}
              {currentUser && currentUser.id === preset.userId && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-1 h-8 px-2"
                        onClick={() => setIsEditDialogOpen(true)}
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                        <span className="text-xs">編集</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>プリセット名を編集</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* 削除ボタン - 自分のプリセットまたはadminユーザーの場合に表示 */}
              {currentUser &&
                (currentUser.id === preset.userId ||
                  currentUser.username === "admin") && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-1 h-8 px-2"
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="text-xs">削除</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>プリセットを削除</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
            </div>
          </div>

          {/* Effect Settings Display */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <dl>
              {/* エフェクト表示のタイトル - INPUT_TRACK_FXタイプの場合 */}
              {preset.type === "INPUT_TRACK_FX" && (
                <div className="flex justify-between mb-4">
                  <h3 className="text-xl font-bold">インプット＆トラックFX</h3>
                </div>
              )}
              
              {/* エフェクト表示 - 通常のプリセットタイプ */}
              {preset.type !== "INPUT_TRACK_FX" && preset.effects.map((effect, index) => {
                const parameters = JSON.parse(effect.parameters);
                const effectParams = getEffectParameters(effect.effectType);
                const bgClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
              

                // パラメータを分類
                const controlParams = {
                  SW: effect.sw ? "ON" : "OFF",
                  "SW MODE": effect.swMode,
                  INSERT: effect.insert,
                };
                const generalParams: Record<string, any> = {};
                const seqControlParams: Record<string, any> = {};
                const seqValueParams: Record<string, any> = {};

                // パラメータをグループ分け
                Object.entries(parameters).forEach(([key, value]) => {
                  // シーケンサーコントロールパラメータ
                  if (key.startsWith("SEQ_") && !key.startsWith("SEQ_VAL")) {
                    seqControlParams[key] = value;
                  }
                  // シーケンサー値パラメータ
                  else if (key.startsWith("SEQ_VAL")) {
                    seqValueParams[key] = value;
                  }
                  // 通常パラメータ
                  else {
                    generalParams[key] = value;
                  }
                });

                // 表示名を取得する関数
                const getDisplayName = (key: string) => {
                  // エフェクトパラメータから表示名を検索
                  const param = effectParams.find((p) => p.name === key);
                  if (param && param.display_name) {
                    return param.display_name;
                  }
                  // 通常のコントロールパラメータはそのまま返す
                  if (key === "SW" || key === "SW MODE" || key === "INSERT") {
                    return key;
                  }
                  // キーからプリフィックスを除去して表示名として使用
                  return key.replace(/^[A-Z]+_/, "");
                };

                // パラメータ値をレンダリングする関数
                const renderParameterValue = (value: any) => {
                  const valueStr = String(value);

                  // notesの場合は画像を表示
                  const noteMatch = valueStr.match(/^notes\d+$/);
                  if (noteMatch) {
                    return (
                      <img
                        src={`/src/assets/notes/${valueStr}.png`}
                        alt={valueStr}
                        className="h-6 object-contain"
                      />
                    );
                  }

                  // それ以外の場合はテキスト表示
                  return valueStr;
                };

                return (
                  <Collapsible
                    key={effect.id}
                    className={`${bgClass} rounded-lg border border-primary/20 mb-4 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 w-full`}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full group bg-primary/10 px-3 py-3 sm:px-4">
                      <div className="flex items-center">
                        <div className="bg-primary text-white font-bold rounded-full h-8 w-8 flex items-center justify-center mr-2">
                          {effect.position}
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-primary">
                          {effect.effectType}
                        </h3>
                      </div>
                      <div className="flex items-center">
                        <Badge
                          className={`mr-2 ${effect.sw ? "bg-green-500" : "bg-gray-400"}`}
                        >
                          {effect.sw ? "ON" : "OFF"}
                        </Badge>
                        <ChevronDown className="h-5 w-5 transition-transform duration-200 text-primary group-data-[state=open]:rotate-180" />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-2 sm:p-4">
                        {/* Effect Control Section */}
                        <div className="mb-6">
                          <h4 className="text-md font-semibold mb-3 text-primary">
                            Effect Control
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(controlParams).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="bg-primary/5 p-2 rounded-lg border border-primary/10 hover:shadow-md transition-shadow"
                                >
                                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                    {key}
                                  </div>
                                  <div className="font-medium text-sm md:text-base">
                                    {String(value)}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        {/* Parameters Section */}
                        {Object.keys(generalParams).length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-md font-semibold mb-3 text-primary">
                              Parameters
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(generalParams).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="bg-primary/5 p-2 rounded-lg border border-primary/10 hover:shadow-md transition-shadow"
                                  >
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                      {getDisplayName(key)}
                                    </div>
                                    <div className="font-medium text-sm md:text-base">
                                      {renderParameterValue(value)}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sequencer Control Section */}
                        {Object.keys(seqControlParams).length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-md font-semibold mb-3 text-primary">
                              Sequencer Parameters
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(seqControlParams).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="bg-primary/5 p-2 rounded-lg border border-primary/10 hover:shadow-md transition-shadow"
                                  >
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                      {getDisplayName(key)}
                                    </div>
                                    <div className="font-medium text-sm md:text-base">
                                      {renderParameterValue(value)}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sequencer Values Section */}
                        {Object.keys(seqValueParams).length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold mb-3 text-primary">
                              Sequencer Values
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(seqValueParams).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="bg-primary/5 p-2 rounded-lg border border-primary/10 hover:shadow-md transition-shadow"
                                  >
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                      {getDisplayName(key)}
                                    </div>
                                    <div className="font-medium text-sm md:text-base">
                                      {renderParameterValue(value)}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {/* 通常プリセットでエフェクトがない場合 */}
              {preset.type !== "INPUT_TRACK_FX" && preset.effects.length === 0 && (
                <div className="px-4 py-5">
                  <p className="text-muted-foreground">
                    エフェクト設定がありません。
                  </p>
                </div>
              )}
              
              {/* INPUT_TRACK_FXタイプのプリセット表示 */}
              {preset.type === "INPUT_TRACK_FX" && (
                <>
                  {/* INPUT FXセクション */}
                  {preset.inputEffects && preset.inputEffects.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-3 text-primary inline-flex items-center">
                        <div className="bg-blue-500 text-white font-bold rounded px-2 py-1 mr-2">INPUT FX</div>
                      </h3>
                      
                      {preset.inputEffects.map((effect, index) => {
                        const parameters = JSON.parse(effect.parameters);
                        const bgClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                        
                        // パラメータを分類
                        const controlParams = {
                          SW: effect.sw ? "ON" : "OFF",
                          "SW MODE": effect.swMode,
                          INSERT: effect.insert,
                        };
                        
                        const generalParams: Record<string, any> = {};
                        Object.entries(parameters).forEach(([key, value]) => {
                          if (!key.startsWith("SEQ_")) {
                            generalParams[key] = value;
                          }
                        });
                        
                        return (
                          <Collapsible
                            key={effect.id}
                            className={`${bgClass} rounded-lg border border-blue-300 mb-4 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 w-full`}
                          >
                            <CollapsibleTrigger className="flex items-center justify-between w-full group bg-blue-100 px-3 py-3 sm:px-4">
                              <div className="flex items-center">
                                <div className="bg-blue-500 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center mr-2">
                                  {effect.position.replace("INPUT_", "")}
                                </div>
                                <h3 className="text-base sm:text-lg font-medium text-blue-700">
                                  {effect.effectType}
                                </h3>
                              </div>
                              <div className="flex items-center">
                                <Badge
                                  className={`mr-2 ${effect.sw ? "bg-green-500" : "bg-gray-400"}`}
                                >
                                  {effect.sw ? "ON" : "OFF"}
                                </Badge>
                                <ChevronDown className="h-5 w-5 transition-transform duration-200 text-blue-700 group-data-[state=open]:rotate-180" />
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className="p-2 sm:p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {Object.entries({...controlParams, ...generalParams}).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="bg-blue-50 p-2 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                                      >
                                        <div className="text-xs text-blue-600 uppercase tracking-wide">
                                          {key.replace(/^[A-Z]+_/, "")}
                                        </div>
                                        <div className="font-medium text-sm md:text-base">
                                          {String(value)}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* TRACK FXセクション */}
                  {preset.trackEffects && preset.trackEffects.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-3 text-primary inline-flex items-center">
                        <div className="bg-purple-500 text-white font-bold rounded px-2 py-1 mr-2">TRACK FX</div>
                      </h3>
                      
                      {preset.trackEffects.map((effect, index) => {
                        const parameters = JSON.parse(effect.parameters);
                        const bgClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                        
                        // パラメータを分類
                        const controlParams = {
                          SW: effect.sw ? "ON" : "OFF",
                          "SW MODE": effect.swMode,
                          INSERT: effect.insert,
                        };
                        
                        const generalParams: Record<string, any> = {};
                        Object.entries(parameters).forEach(([key, value]) => {
                          if (!key.startsWith("SEQ_")) {
                            generalParams[key] = value;
                          }
                        });
                        
                        return (
                          <Collapsible
                            key={effect.id}
                            className={`${bgClass} rounded-lg border border-purple-300 mb-4 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 w-full`}
                          >
                            <CollapsibleTrigger className="flex items-center justify-between w-full group bg-purple-100 px-3 py-3 sm:px-4">
                              <div className="flex items-center">
                                <div className="bg-purple-500 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center mr-2">
                                  {effect.position.replace("TRACK_", "")}
                                </div>
                                <h3 className="text-base sm:text-lg font-medium text-purple-700">
                                  {effect.effectType}
                                </h3>
                              </div>
                              <div className="flex items-center">
                                <Badge
                                  className={`mr-2 ${effect.sw ? "bg-green-500" : "bg-gray-400"}`}
                                >
                                  {effect.sw ? "ON" : "OFF"}
                                </Badge>
                                <ChevronDown className="h-5 w-5 transition-transform duration-200 text-purple-700 group-data-[state=open]:rotate-180" />
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className="p-2 sm:p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {Object.entries({...controlParams, ...generalParams}).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="bg-purple-50 p-2 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
                                      >
                                        <div className="text-xs text-purple-600 uppercase tracking-wide">
                                          {key.replace(/^[A-Z]+_/, "")}
                                        </div>
                                        <div className="font-medium text-sm md:text-base">
                                          {String(value)}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* INPUT_TRACK_FXでエフェクトがない場合 */}
                  {(!preset.inputEffects || preset.inputEffects.length === 0) && 
                   (!preset.trackEffects || preset.trackEffects.length === 0) && (
                    <div className="px-4 py-5">
                      <p className="text-muted-foreground">
                        エフェクト設定がありません。
                      </p>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        </CardContent>
      </Card>
      {/* プリセット名編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プリセット名の編集</DialogTitle>
            <DialogDescription>
              プリセットの名前を変更します。変更後は「保存」ボタンをクリックしてください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="プリセット名"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewPresetName(preset.name);
                setIsEditDialogOpen(false);
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => updateNameMutation.mutate(newPresetName)}
              disabled={!newPresetName.trim() || updateNameMutation.isPending}
            >
              {updateNameMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* プリセット削除確認ダイアログ */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プリセットの削除</AlertDialogTitle>
            <AlertDialogDescription>
              このプリセットを削除しますか？この操作は取り消せません。
              コメント、いいね、ブックマークなどの関連データもすべて削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
