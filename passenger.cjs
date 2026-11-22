// Entry point for hosting panels that require a CommonJS startup file.
// Node.js 20+ (Node 20 uses the node-sqlite3-wasm driver via sqlite.js). Keep a single application worker.
import('./server.js').catch(error=>{
  console.error('myKampung gagal dimulakan:',error.message);
  process.exitCode=1;
});
