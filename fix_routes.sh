#!/bin/bash

# Fix all routes with mismatched quotes
sed -i 's/router\.put("\/items\/:id\x27/router.put("\/items\/:id"/g' server/routes-marketplace.ts
sed -i 's/router\.delete("\/items\/:id\x27/router.delete("\/items\/:id"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/items\/:id\/buy\x27/router.post("\/items\/:id\/buy"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/items\/:id\/offer\x27/router.post("\/items\/:id\/offer"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/offers\/:id\/respond\x27/router.post("\/offers\/:id\/respond"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/offers\/:id\/cancel\x27/router.post("\/offers\/:id\/cancel"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/transactions\x27/router.get("\/transactions"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/transactions\/:id\x27/router.get("\/transactions\/:id"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/transactions\/:id\/messages\x27/router.post("\/transactions\/:id\/messages"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/transactions\/:id\/receipt\x27/router.post("\/transactions\/:id\/receipt"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/transactions\/:id\/address\x27/router.post("\/transactions\/:id\/address"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/transactions\/:id\/tracking\x27/router.post("\/transactions\/:id\/tracking"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/transactions\/:id\/delivery-status\x27/router.post("\/transactions\/:id\/delivery-status"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/transactions\/:id\/problem\x27/router.post("\/transactions\/:id\/problem"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/transactions\/:id\/cancel\x27/router.post("\/transactions\/:id\/cancel"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/offers\x27/router.get("\/offers"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/items\/:id\/save\x27/router.post("\/items\/:id\/save"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/saved\x27/router.get("\/saved"/g' server/routes-marketplace.ts
sed -i 's/router\.post("\/items\/:id\/report\x27/router.post("\/items\/:id\/report"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/dashboard\/listings\x27/router.get("\/dashboard\/listings"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/dashboard\/transactions\x27/router.get("\/dashboard\/transactions"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/dashboard\/offers\x27/router.get("\/dashboard\/offers"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/dashboard\/saved\x27/router.get("\/dashboard\/saved"/g' server/routes-marketplace.ts
sed -i 's/router\.get("\/dashboard\/messages\x27/router.get("\/dashboard\/messages"/g' server/routes-marketplace.ts

echo "All quotes fixed!"
