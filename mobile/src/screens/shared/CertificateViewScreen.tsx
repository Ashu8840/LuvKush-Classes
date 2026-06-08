import { useEffect, useState } from "react";
import { ActivityIndicator, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";
import { api } from "../../lib/api";
import { Screen, Button } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

type Params = { CertificateView: { certificateId: string } };

export default function CertificateViewScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<Params, "CertificateView">>();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.certificateId) {
      api.getCertificateRenderUrl(route.params.certificateId).then(setUrl);
    }
  }, [route.params?.certificateId]);

  return (
    <Screen title="Certificate" action={url ? <Button label="Open" small onPress={() => Linking.openURL(url)} /> : undefined}>
      {!url ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <WebView
          source={{ uri: url }}
          style={{ flex: 1, backgroundColor: colors.background }}
          startInLoadingState
          renderLoading={() => <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
        />
      )}
    </Screen>
  );
}