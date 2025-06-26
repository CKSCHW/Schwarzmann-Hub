
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Loader2, Edit } from 'lucide-react';
import type { SimpleUser, UserGroup } from '@/types';
import { userGroups } from '@/types';
import { updateUserGroups } from '@/actions/adminActions';
import { Label } from '@/components/ui/label';

interface UserGroupManagerProps {
  initialUsers: SimpleUser[];
}

export default function UserGroupManager({ initialUsers }: UserGroupManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<UserGroup[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (user: SimpleUser) => {
    setSelectedUser(user);
    setSelectedGroups(user.groups || []);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  }

  const handleGroupChange = (group: UserGroup, checked: boolean) => {
    setSelectedGroups(prev =>
      checked ? [...prev, group] : prev.filter(g => g !== group)
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      await updateUserGroups(selectedUser.uid, selectedGroups);
      // Update local state to reflect changes immediately
      setUsers(users.map(u => u.uid === selectedUser.uid ? { ...u, groups: selectedGroups } : u));
      toast({
        title: 'Erfolgreich gespeichert',
        description: `Die Gruppen für ${selectedUser.displayName || selectedUser.email} wurden aktualisiert.`,
      });
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Fehler beim Speichern',
        description: 'Die Gruppen konnten nicht aktualisiert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Benutzergruppen verwalten
        </CardTitle>
        <CardDescription>
          Weise hier den Benutzern Gruppen zu, um den Zugriff auf Termine und andere Inhalte zu steuern.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benutzer</TableHead>
              <TableHead>Zugeordnete Gruppen</TableHead>
              <TableHead className="text-right">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">
                  <div>{user.displayName || user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                    {user.groups && user.groups.length > 0 ? (
                      user.groups.map(group => (
                        <Badge key={group} variant="secondary">{group}</Badge>
                      ))
                    ) : (
                      !user.isAdmin && <span className="text-muted-foreground text-xs">Keine Gruppen</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Verwalten
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {selectedUser && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gruppen für {selectedUser.displayName || selectedUser.email}</DialogTitle>
                        <DialogDescription>
                        Wähle die Gruppen aus, denen dieser Benutzer angehören soll.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {userGroups.map(group => (
                        <div key={group} className="flex items-center space-x-2">
                            <Checkbox
                            id={`${selectedUser.uid}-${group}`}
                            checked={selectedGroups.includes(group)}
                            onCheckedChange={(checked) => handleGroupChange(group, !!checked)}
                            />
                            <Label htmlFor={`${selectedUser.uid}-${group}`}>{group}</Label>
                        </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={handleCloseDialog}>Abbrechen</Button>
                        <Button onClick={handleSaveChanges} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="animate-spin mr-2" />}
                        Speichern
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
