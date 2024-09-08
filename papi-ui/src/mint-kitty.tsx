import { Button, Heading } from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKittyContext } from "./context/kitty-context";

export function MintKitty() {
  const { polkadotSigner, api } = useKittyContext();
  const queryClient = useQueryClient();
  const { mutate: mintKitty, isPending } = useMutation({
    mutationKey: ["mintKitty"],
    mutationFn: async () =>
      api.tx.Kitties.create_kitty().signAndSubmit(polkadotSigner!),
    onSuccess: async (response) => {
      console.log("Kitty minted", response);
      if (response.ok) {
        toast.success("Kitty minted successfully");
      } else {
        toast.error(
          "Kitty minting failed, check the console for more information"
        );
      }
      queryClient.invalidateQueries({ queryKey: ["kitties"] });
    },
  });

  function handleMintKitty() {
    if (!polkadotSigner) {
      toast.error("No signer found");
      return;
    }
    mintKitty();
  }

  return (
    <>
      <Heading>Mint New Kitty</Heading>
      <Button
        onClick={handleMintKitty}
        loading={isPending}
        disabled={polkadotSigner === undefined}
      >
        Mint New Kitty
      </Button>
    </>
  );
}
