PKGARCH=amd64
AWS_FLAVOR=t3.nano
AWS_REGION=eu-west-2
AWS_BUCKET_NAME=nano-test-bucket
PKGNAME=radiosilence/nano-web
PKGVERSION=latest
IMAGE_DIR=./build
IMAGE_NAME=blit-web-$(PKGARCH)

clean:
	rm -rf $(IMAGE_DIR)

install:
	bun install

build: install
	bun run build

image-dir:
	mkdir -p $(IMAGE_DIR)

image-copy-assets: image-dir build
	rm -rf $(IMAGE_DIR)/public
	cp -r ./dist $(IMAGE_DIR)/public

image-create-config: image-dir 
	AWS_REGION=$(AWS_REGION) AWS_BUCKET_NAME=$(AWS_BUCKET_NAME) PKGARCH=$(PKGARCH) AWS_FLAVOR=$(AWS_FLAVOR) ./scripts/image-make-config.sh > $(IMAGE_DIR)/config.json

image-create: image-create-config image-copy-assets
	cd $(IMAGE_DIR) && ops image create -c config.json --package $(PKGNAME):$(PKGVERSION) --arch $(PKGARCH) -i $(IMAGE_NAME)

image-create-aws: image-create-config image-copy-assets
	ops image delete -t aws -z $(AWS_REGION) $(IMAGE_NAME) --assume-yes
	cd $(IMAGE_DIR) && ops image create -t aws -c config.json --package $(PKGNAME):$(PKGVERSION) --arch $(PKGARCH) -i $(IMAGE_NAME)

image-get-aws:
	@ops image list -t aws -z $(AWS_REGION)  --json | jq -c '.[] | select(.Tag | contains("$(IMAGE_NAME)"))'


tf-vars:
	@echo --var 'ami_id=$(shell make image-get-aws | jq -r '.ID')' 
 
tf-init:
	cd terraform && terraform init

tf-plan:
	cd terraform && terraform plan $(shell make tf-vars)

tf-apply:
	cd terraform && terraform apply $(shell make tf-vars)

tf-destroy:
	cd terraform && terraform destroy $(shell make tf-vars)