// SimpleImageTest.tsx
import React from 'react';

export function SimpleImageTest() {
  const imagePath = '/images/notes/notes1.png';
  return (
    <div>
      <h2>画像テスト</h2>
      <img
        src={imagePath}
        alt="Test Note Image"
        style={{ width: '50px', height: '50px', border: '1px solid red' }} // インラインスタイルでサイズと境界線を指定
      />
      <p>パス: {imagePath}</p>
    </div>
  );
}