import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ProfileModal() {
    const { user } = useAuth();
    const { dailyScansUsed, dailyScanLimit, hasPaidPlan } = useSubscription();
    const [isOpen, setIsOpen] = useState(false);
    const [fullName, setFullName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // If user is logged in
        if (user) {
            // If name is missing, open modal
            if (!user.user_metadata?.full_name) {
                setIsOpen(true);
            }

            // Auto-initialize credits if missing even if name exists
            if (user.user_metadata?.credits === undefined) {
                supabase.auth.updateUser({
                    data: { credits: 20 }
                });
            }
        } else {
            setIsOpen(false);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fullName.trim().length < 2) {
            toast.error("Please enter a valid name");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName.trim(),
                    credits: user?.user_metadata?.credits ?? 20
                },
            });

            if (error) throw error;

            toast.success("Profile updated successfully!");
            setIsOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        Please provide your full name to continue.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Daily Scans</Label>
                                {hasPaidPlan && <span className="text-purple-500 font-bold">Unlimited</span>}
                            </div>

                            {hasPaidPlan ? (
                                <div className="h-4 w-full bg-secondary rounded-full overflow-hidden relative">
                                    <div className="absolute inset-0 bg-purple-500/20 animate-pulse"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold text-purple-500">∞</span>
                                    </div>
                                    <div className="h-full bg-purple-500 w-full origin-left" />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${Math.min((dailyScansUsed / dailyScanLimit) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-end text-xs text-muted-foreground mt-1">
                                        <span>{dailyScansUsed >= dailyScanLimit ? "Limit reached" : "Resets at 11 PM"}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? "Saving..." : "Save Profile"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
