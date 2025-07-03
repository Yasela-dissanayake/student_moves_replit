/**
 * OpenAI API Key Input Component
 * Allows users to input their own OpenAI API key
 */

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2Icon, KeyIcon, AlertTriangleIcon, CheckCircleIcon, Loader2 } from "lucide-react";

export function OpenAIKeyInput() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string>("");
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [hasSystemKey, setHasSystemKey] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Check for system API key and stored key on load
  useEffect(() => {
    async function checkApiKeyStatus() {
      try {
        // Check system API key status
        const systemResponse = await fetch("/api/ai/openai/status");
        const systemData = await systemResponse.json();
        setHasSystemKey(systemData.available);

        // Check if user has a stored key
        const storedKey = sessionStorage.getItem("openai_api_key");
        if (storedKey) {
          setSavedApiKey(storedKey);
          // Validate stored key
          await validateApiKey(storedKey);
        }
      } catch (error) {
        console.error("Error checking API key status:", error);
      } finally {
        setIsChecking(false);
      }
    }

    checkApiKeyStatus();
  }, []);

  // Function to validate API key
  const validateApiKey = async (key: string): Promise<boolean> => {
    setIsValidating(true);
    setIsValid(null);

    try {
      const response = await fetch("/api/ai/openai/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await response.json();
      setIsValid(data.valid);
      return data.valid;
    } catch (error) {
      console.error("Error validating API key:", error);
      setIsValid(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Save API key
  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }

    const isKeyValid = await validateApiKey(apiKey);

    if (isKeyValid) {
      // Save to session storage
      sessionStorage.setItem("openai_api_key", apiKey);
      setSavedApiKey(apiKey);

      // Also store on server session if available
      try {
        await fetch("/api/ai/openai/store-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey }),
        });
      } catch (error) {
        console.error("Error storing API key on server:", error);
        // Continue anyway since we have it in session storage
      }

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved for this session.",
      });
      
      setApiKey("");
    } else {
      toast({
        title: "Invalid API Key",
        description: "The API key you entered could not be validated with OpenAI.",
        variant: "destructive",
      });
    }
  };

  // Remove saved API key
  const removeSavedKey = () => {
    sessionStorage.removeItem("openai_api_key");
    setSavedApiKey(null);
    setIsValid(null);

    // Also try to remove from server session
    fetch("/api/ai/openai/store-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: "" }),
    }).catch(error => {
      console.error("Error removing API key from server:", error);
    });

    toast({
      title: "API Key Removed",
      description: "Your OpenAI API key has been removed from this session.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <KeyIcon className="h-5 w-5 mr-2" />
            OpenAI API Key
          </span>
          {isChecking ? (
            <Badge variant="outline" className="ml-2">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Checking
            </Badge>
          ) : hasSystemKey ? (
            <Badge variant="secondary" className="ml-2">System Key Available</Badge>
          ) : (
            <Badge variant="outline" className="ml-2 text-yellow-600 bg-yellow-50">No System Key</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasSystemKey 
            ? "A system-wide API key is already available, but you can use your own for better rate limits."
            : "No system API key is available. Please provide your own OpenAI API key to use AI features."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedApiKey ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">API Key Active</AlertTitle>
            <AlertDescription className="text-green-700">
              Your personal OpenAI API key is currently active and will be used for all AI requests.
            </AlertDescription>
          </Alert>
        ) : hasSystemKey === false && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              No OpenAI API key is available. You'll need to provide your own key to use AI features.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center">
            <Input
              type="password"
              placeholder="Enter your OpenAI API key (sk-...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
              disabled={isValidating}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your API key is stored securely in your browser's session and never saved to our database.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {savedApiKey ? (
          <Button 
            variant="outline" 
            className="text-destructive hover:text-destructive"
            onClick={removeSavedKey}
          >
            <Trash2Icon className="h-4 w-4 mr-2" />
            Remove API Key
          </Button>
        ) : (
          <span></span>
        )}

        <Button 
          onClick={saveApiKey} 
          disabled={!apiKey.trim() || isValidating}
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <KeyIcon className="mr-2 h-4 w-4" />
              {savedApiKey ? "Update API Key" : "Save API Key"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}