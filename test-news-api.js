// ニュースAPIをテストするための簡単なスクリプト
async function testNewsAPI() {
  console.log("=== ニュースAPIテスト開始 ===");
  
  try {
    // 通常のニュースを取得
    console.log("👉 通常ニュースを取得中...");
    const regularResponse = await fetch("http://localhost:3000/api/news?pinned=false");
    console.log(`ステータス: ${regularResponse.status}`);
    
    if (!regularResponse.ok) {
      console.error(`エラー: ${regularResponse.status} ${regularResponse.statusText}`);
    } else {
      const regularData = await regularResponse.json();
      console.log(`取得成功: ${regularData.length}件のニュース`);
      console.log(regularData);
    }
    
    // ピン留めニュースを取得
    console.log("\n👉 ピン留めニュースを取得中...");
    const pinnedResponse = await fetch("http://localhost:3000/api/news?pinned=true");
    console.log(`ステータス: ${pinnedResponse.status}`);
    
    if (!pinnedResponse.ok) {
      console.error(`エラー: ${pinnedResponse.status} ${pinnedResponse.statusText}`);
    } else {
      const pinnedData = await pinnedResponse.json();
      console.log(`取得成功: ${pinnedData.length}件のニュース`);
      console.log(pinnedData);
    }
    
  } catch (error) {
    console.error("テスト中にエラーが発生しました:", error);
  }
  
  console.log("=== ニュースAPIテスト終了 ===");
}

// テスト実行
testNewsAPI();