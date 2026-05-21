echo "Test A"
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "x-air-gap-mode: true" \
  -d '{"messages":[{"role":"user","content":"hello"}],"provider":"openai","model":"gpt-4o"}' | jq .
echo "Test B"
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "x-air-gap-mode: true" \
  -d '{"messages":[{"role":"user","content":"hello"}],"provider":"ollama","model":"llama3"}' | head -n 5
echo -e "\nTest C"
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}],"provider":"openai","model":"gpt-4o"}' | jq .
echo "Test 4 Tor Route"
curl -s http://localhost:3000/api/deploy/tor | jq .
echo "Test 5 Web3 Scaffold"
curl -s -X POST http://localhost:3000/api/web3/scaffold \
  -H "Content-Type: application/json" \
  -d '{"workspacePath": "/tmp/rogue_test_workspace"}' | jq .
echo "Test 5 Web3 Scaffold 2"
curl -s -X POST http://localhost:3000/api/web3/scaffold \
  -H "Content-Type: application/json" \
  -d '{"workspacePath": "/tmp/rogue_test_workspace"}' | jq .
