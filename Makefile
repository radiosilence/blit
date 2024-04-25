update-blit:
	kubectl rollout restart deployment blit-web --namespace blit
update-navidrome:
	kubectl rollout restart statefulset navidrome --namespace blit
deploy:
	kubectl apply -f ./k8s/k8s.blit.yml -f ./k8s/letsencrypt-prod.yml