# Build IOS sans liscense apple dev

Dans le dossier mobile: 
```
rm -rf /ios
rm -rf ~/Library/Developer/Xcode/DerivedData/<nomapp>*
npx expo prebuild --platform ios --clean
cd ios && pod install
``` 

Ces commandes vont générer un projet xcode dans ios
Ouvrir le fichier .xcworkspace ET PAS .xccodeproj

Selectionner une cible (any ios device arm64 par exemple, ou connecter son iphone et le selectionner)

Selectionner la Target dans l'explorateur, puis dans le menu Signing & Capabilities, selectionner sa team, et son Bundle Identifier (unique)

Dans la barre des menus, choisir Product -> Archive. Si tout se passe bien c'est la fête.
A la fin du build, une popup s'ouvre avec les archives. Cette popup est aussi accessible via Window -> Organizer.

Clique droit sur l'app que l'on vient de build -> Show in Finder. Dans Finder, clique droit sur l'archive -> Afficher le contenu du paquet -> Products -> Applications. Copier le .app dans un nouveau dossier `Payload` (hors de l'archive), puis compresser ce dossier en .zip.

Une fois en possession de ce zip, on peut changer l'extension en .ipa et on à notre installable via un sideloader (altStore)