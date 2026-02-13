{ pkgs, ... }: {
  # Especifica el canal de Nix que quieres usar.
  channel = "stable-24.05";

  # Añade los paquetes necesarios para tu proyecto de React Native.
  packages = [
    pkgs.nodejs_20  # Asegura una versión de Node.js compatible (>= 20.19.4)
    pkgs.openjdk17   # Java Development Kit requerido para Android
  ];

  # Opcional: Instala extensiones de VS Code útiles.
  idx.extensions = [
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
  ];
}
