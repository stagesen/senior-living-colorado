import { MessageSquareText, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function ChatServiceCTA() {
  return (
    <Card className="overflow-hidden border border-primary/20 shadow-lg mb-6 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="bg-primary/10 p-4 rounded-full">
          <Bot className="h-10 w-10 text-primary" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-semibold mb-2">Need help deciding?</h3>
          <p className="text-muted-foreground mb-0">
            Our AI assistant can help you find the perfect senior living option based on your specific needs and preferences.
          </p>
        </div>
        
        <Link href="/chat">
          <Button className="whitespace-nowrap flex items-center gap-2" size="lg">
            <MessageSquareText className="h-5 w-5" />
            Chat with AI
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
