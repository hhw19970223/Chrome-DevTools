import { host } from "@/panel/const";

export function X7c() {
  const i = new Uint8Array(16);
  return (
    crypto.getRandomValues(i),
    Array.from(i, (e) => e.toString(16).padStart(2, "0")).join("")
  );
}
export function Q7c() {
  const i = new Uint8Array(8);
  return (
    crypto.getRandomValues(i),
    Array.from(i, (e) => e.toString(16).padStart(2, "0")).join("")
  );
}

export const traceparent = `00-${X7c()}-${Q7c()}-00`;

export async function uploadChatLargeData(uuid: string, largeData: any) {
  // 1. 将大数据分块
  const CHUNK_SIZE = 512 * 1024; 
  const dataString = JSON.stringify(largeData);
  const totalSize = dataString.length;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
  
  console.log(`开始分段上传，总大小: ${totalSize}, 分为 ${totalChunks} 块`);
  
  // 2. 上传每个数据块
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunkData = dataString.substring(start, end);
    
    const response = await fetch(host + '/api/cursor/chat', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uuid,
        chunkIndex: i,
        totalChunks,
        chunkData
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`上传块 ${i} 失败`);
    }
    
    console.log(`进度: ${result.receivedChunks}/${result.totalChunks}`);
  }
  
  // 3. 完成上传并合并数据
  const mergeResponse = await fetch(host + '/api/cursor/chat', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uuid })
  });
  
  const mergeResult = await mergeResponse.json();
  
  if (mergeResult.success) {
    console.log('上传完成！', mergeResult);
  } else {
    throw new Error('合并数据失败');
  }
  
  return mergeResult;
}