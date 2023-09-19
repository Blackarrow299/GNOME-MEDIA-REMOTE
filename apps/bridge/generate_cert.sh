#!/bin/bash

output_path="./cert"

mkdir -p "$output_path"

openssl genpkey -algorithm RSA -out "$output_path/key.pem"

openssl req -new -x509 -key "$output_path/key.pem" -out "$output_path/cert.pem"

 openssl x509 -in cert.pem -pubkey -noout > public_key.pem
 
# cat "$output_path/server.key" "$output_path/server.crt" > "$output_path/server.pem"

echo "Self-signed TLS certificate generated at: $output_path"
