"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define system configuration schema with required fields
const systemSettingsSchema = z.object({
  siteName: z.string().min(2, {
    message: "Site name must be at least 2 characters.",
  }),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  maxUploadSizeMB: z.number().min(1).max(1000),
  maxUserUploadsPerDay: z.number().min(1),
  maintenanceMode: z.boolean(),
});

// Define notification settings schema with required fields
const notificationSettingsSchema = z.object({
  enableEmailNotifications: z.boolean(),
  notifyOnNewUsers: z.boolean(),
  notifyOnReports: z.boolean(),
  notifyOnErrors: z.boolean(),
  adminEmailAddresses: z.string(),
});

// Define feature toggle schema with required fields
const featureToggleSchema = z.object({
  enableUserRegistration: z.boolean(),
  enableComments: z.boolean(),
  enableUserUploads: z.boolean(),
  enableUserPlaylists: z.boolean(),
  enableSharing: z.boolean(),
  enablePremiumFeatures: z.boolean(),
});

// Define the types from the Zod schemas to ensure they align
type SystemConfigData = z.infer<typeof systemSettingsSchema>;

type NotificationConfigData = z.infer<typeof notificationSettingsSchema>;

type FeatureToggleData = z.infer<typeof featureToggleSchema>;

const SettingsPage = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");

  // Create forms with React Hook Form
  const systemForm = useForm<SystemConfigData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      siteName: "Sound App",
      siteDescription: "A platform for music lovers",
      contactEmail: "admin@soundapp.com",
      maxUploadSizeMB: 50,
      maxUserUploadsPerDay: 10,
      maintenanceMode: false,
    },
  });

  const notificationForm = useForm<NotificationConfigData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      enableEmailNotifications: true,
      notifyOnNewUsers: true,
      notifyOnReports: true,
      notifyOnErrors: true,
      adminEmailAddresses: "admin@soundapp.com,tech@soundapp.com",
    },
  });

  const featureToggleForm = useForm<FeatureToggleData>({
    resolver: zodResolver(featureToggleSchema),
    defaultValues: {
      enableUserRegistration: true,
      enableComments: true,
      enableUserUploads: true,
      enableUserPlaylists: true,
      enableSharing: true,
      enablePremiumFeatures: true,
    },
  });

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.access_token) return;

      try {
        setIsLoading(true);

        // Fetch system settings
        const systemResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/system`,
          {
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (systemResponse.ok) {
          const systemData = await systemResponse.json();
          if (systemData && systemData.data) {
            systemForm.reset(systemData.data);
          }
        }

        // Fetch notification settings
        const notificationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/notifications`,
          {
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (notificationResponse.ok) {
          const notificationData = await notificationResponse.json();
          if (notificationData && notificationData.data) {
            notificationForm.reset(notificationData.data);
          }
        }

        // Fetch feature toggles
        const featureResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/features`,
          {
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (featureResponse.ok) {
          const featureData = await featureResponse.json();
          if (featureData && featureData.data) {
            featureToggleForm.reset(featureData.data);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [session]);

  // Handle system settings form submission
  const onSystemSubmit = async (data: SystemConfigData) => {
    if (!session?.user?.access_token) return;

    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/system`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("System settings updated successfully");
    } catch (error) {
      console.error("Error updating system settings:", error);
      toast.error("Failed to update system settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification settings form submission
  const onNotificationSubmit = async (data: NotificationConfigData) => {
    if (!session?.user?.access_token) return;

    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/notifications`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Notification settings updated successfully");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle feature toggle form submission
  const onFeatureToggleSubmit = async (data: FeatureToggleData) => {
    if (!session?.user?.access_token) return;

    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/features`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Feature settings updated successfully");
    } catch (error) {
      console.error("Error updating feature settings:", error);
      toast.error("Failed to update feature settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage application settings and configurations.
        </p>
      </div>

      <Tabs
        defaultValue="general"
        value={currentTab}
        onValueChange={setCurrentTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Configure basic system settings and parameters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...systemForm}>
                <form
                  onSubmit={systemForm.handleSubmit(onSystemSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={systemForm.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter site name" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name displayed in the title and header.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={systemForm.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter site description"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description used in metadata.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={systemForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Primary contact email for the system.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={systemForm.control}
                      name="maxUploadSizeMB"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Upload Size (MB)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum file size in megabytes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={systemForm.control}
                      name="maxUserUploadsPerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max User Uploads Per Day</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Daily upload limit per user.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={systemForm.control}
                      name="maintenanceMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Maintenance Mode</FormLabel>
                            <FormDescription>
                              Temporarily disable public access to the site.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <CardFooter className="px-0 pt-6">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="ml-auto"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email notifications and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form
                  onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="enableEmailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Email Notifications</FormLabel>
                            <FormDescription>
                              Enable or disable all email notifications.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={notificationForm.control}
                        name="notifyOnNewUsers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>New User Notifications</FormLabel>
                              <FormDescription>
                                Notify when new users register.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !notificationForm.getValues(
                                    "enableEmailNotifications"
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="notifyOnReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Report Notifications</FormLabel>
                              <FormDescription>
                                Notify on new user reports.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !notificationForm.getValues(
                                    "enableEmailNotifications"
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="notifyOnErrors"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Error Notifications</FormLabel>
                              <FormDescription>
                                Notify on system errors and exceptions.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !notificationForm.getValues(
                                    "enableEmailNotifications"
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-4" />
                    <FormField
                      control={notificationForm.control}
                      name="adminEmailAddresses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email Addresses</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter email addresses (comma separated)"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of email addresses to receive
                            admin notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <CardFooter className="px-0 pt-6">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="ml-auto"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Toggles Tab */}
        <TabsContent value="features" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Management</CardTitle>
              <CardDescription>
                Enable or disable platform features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...featureToggleForm}>
                <form
                  onSubmit={featureToggleForm.handleSubmit(
                    onFeatureToggleSubmit
                  )}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={featureToggleForm.control}
                      name="enableUserRegistration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FormLabel>User Registration</FormLabel>
                              {field.value && (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </div>
                            <FormDescription>
                              Allow new users to register.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={featureToggleForm.control}
                      name="enableComments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FormLabel>Comments</FormLabel>
                              {field.value && (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </div>
                            <FormDescription>
                              Allow users to comment on tracks.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={featureToggleForm.control}
                      name="enableUserUploads"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FormLabel>Track Uploads</FormLabel>
                              {field.value && (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </div>
                            <FormDescription>
                              Allow users to upload tracks.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={featureToggleForm.control}
                      name="enableUserPlaylists"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FormLabel>User Playlists</FormLabel>
                              {field.value && (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </div>
                            <FormDescription>
                              Allow users to create playlists.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={featureToggleForm.control}
                      name="enableSharing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FormLabel>Social Sharing</FormLabel>
                              {field.value && (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </div>
                            <FormDescription>
                              Allow content sharing on social networks.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={featureToggleForm.control}
                      name="enablePremiumFeatures"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FormLabel>Premium Features</FormLabel>
                              {field.value && (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </div>
                            <FormDescription>
                              Enable premium subscription features.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <CardFooter className="px-0 pt-6">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="ml-auto"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
