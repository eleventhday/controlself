
export class RSIPEngine {
    constructor() {
        this.nodes = [];
        this.rootId = 'root';
        this.importedTrees = [];
        this.daily = { date: null, count: 0 };
        this.load();
    }

    load() {
        const stored = localStorage.getItem('rsip_nodes');
        if (stored) {
            this.nodes = JSON.parse(stored);
        } else {
            this.initDefault();
        }
        const imp = localStorage.getItem('rsip_imported_trees');
        if (imp) {
            this.importedTrees = JSON.parse(imp);
        }
        const dailyStr = localStorage.getItem('rsip_daily');
        if (dailyStr) {
            this.daily = JSON.parse(dailyStr);
        }
    }

    initDefault() {
        this.nodes = [{
            id: 'root',
            title: '核心协议',
            description: '每天打开此应用并回顾这些国策。',
            status: 'inactive',
            parentId: null,
            children: []
        }];
        this.save();
    }

    save() {
        localStorage.setItem('rsip_nodes', JSON.stringify(this.nodes));
        localStorage.setItem('rsip_imported_trees', JSON.stringify(this.importedTrees));
        localStorage.setItem('rsip_daily', JSON.stringify(this.daily));
    }

    getNodes() {
        return this.nodes;
    }

    moveNode(nodeId, newParentId) {
        if (nodeId === 'root' || nodeId === newParentId) return;
        
        const node = this.nodes.find(n => n.id === nodeId);
        const newParent = this.nodes.find(n => n.id === newParentId);
        
        if (!node || !newParent) return;

        // Prevent circular dependency (cannot move parent into its own child)
        if (this.isDescendant(nodeId, newParentId)) {
             alert('无法将父节点移动到其子节点下');
             return;
        }

        // Remove from old parent
        if (node.parentId) {
            const oldParent = this.nodes.find(n => n.id === node.parentId);
            if (oldParent) {
                oldParent.children = oldParent.children.filter(id => id !== nodeId);
            }
        }

        // Add to new parent
        node.parentId = newParentId;
        newParent.children.push(nodeId);

        this.save();
    }

    isDescendant(parentId, childId) {
        const parent = this.nodes.find(n => n.id === parentId);
        if (!parent) return false;
        
        if (parent.children.includes(childId)) return true;
        
        for (const pid of parent.children) {
            if (this.isDescendant(pid, childId)) return true;
        }
        return false;
    }

    addNode(parentId, title, description) {
        if (!this.canActivateToday()) throw new Error('今天已点亮或新增过节点');
        const newNode = {
            id: Date.now().toString(),
            title,
            description,
            status: 'inactive',
            parentId,
            children: []
        };
        
        this.nodes.push(newNode);
        
        const parent = this.nodes.find(n => n.id === parentId);
        if (parent) {
            parent.children.push(newNode.id);
        }
        
        this.increaseDaily();
        this.save();
        return newNode;
    }

    updateNodeStatus(id, status) {
        const node = this.nodes.find(n => n.id === id);
        if (node) {
            node.status = status;
            this.save();
        }
    }

    activateNode(id) {
        if (!this.canActivateToday()) throw new Error('今天只能点亮一个节点');
        const node = this.nodes.find(n => n.id === id);
        if (!node) return;
        node.status = 'active';
        this.increaseDaily();
        this.save();
    }

    extinguishNode(id) {
        const toProcess = [id];
        while (toProcess.length) {
            const cur = toProcess.pop();
            const node = this.nodes.find(n => n.id === cur);
            if (!node) continue;
            node.status = 'inactive';
            toProcess.push(...(node.children || []));
        }
        this.save();
    }

    canActivateToday() {
        const today = this.localDate();
        if (this.daily.date !== today) {
            this.daily.date = today;
            this.daily.count = 0;
            this.save();
        }
        return this.daily.count < 1;
    }

    increaseDaily() {
        const today = this.localDate();
        if (this.daily.date !== today) {
            this.daily.date = today;
            this.daily.count = 0;
        }
        this.daily.count += 1;
    }

    localDate() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    deleteNode(id) {
        if (id === 'root') return;
        
        const nodeIndex = this.nodes.findIndex(n => n.id === id);
        if (nodeIndex === -1) return;
        
        const node = this.nodes[nodeIndex];
        
        if (node.parentId) {
            const parent = this.nodes.find(n => n.id === node.parentId);
            if (parent) {
                parent.children = parent.children.filter(childId => childId !== id);
            }
        }
        
        const toRemove = [id];
        let i = 0;
        while(i < toRemove.length) {
            const currentId = toRemove[i];
            const children = this.nodes.filter(n => n.parentId === currentId).map(n => n.id);
            toRemove.push(...children);
            i++;
        }
        
        this.nodes = this.nodes.filter(n => !toRemove.includes(n.id));
        this.save();
    }

    // --- Sharing Features ---

    // Export current tree as a Base64 string
    exportTree() {
        try {
            const json = JSON.stringify(this.nodes);
            // Simple Base64 encoding (UTF-8 safe)
            return btoa(unescape(encodeURIComponent(json)));
        } catch (e) {
            console.error("Export failed:", e);
            return null;
        }
    }

    // Import a tree from a Base64 string
    // mode: 'replace' (overwrite current), 'preview' (just return data)
    importTree(base64Str, mode = 'preview') {
        try {
            const json = decodeURIComponent(escape(atob(base64Str)));
            const nodes = JSON.parse(json);
            
            // Basic validation
            if (!Array.isArray(nodes) || !nodes.find(n => n.id === 'root')) {
                throw new Error("Invalid format: Root node missing");
            }

            if (mode === 'replace') {
                this.nodes = nodes;
                this.save();
                return true;
            }
            
            return nodes; // Return for preview
        } catch (e) {
            console.error("Import failed:", e);
            throw new Error("Invalid Share Code");
        }
    }

    importAsNewTree(base64Str, name = '导入国策树') {
        const nodes = this.importTree(base64Str, 'preview');
        const resetNodes = nodes.map(n => ({ ...n, status: 'inactive' }));
        const id = Date.now().toString();
        this.importedTrees.push({ id, name, nodes: resetNodes });
        this.save();
        return id;
    }

    getImportedTrees() {
        return this.importedTrees;
    }
}
