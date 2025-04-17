import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Image,
  Grid,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl, uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";

// Add Google Font
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// Amplify configuration
Amplify.configure(outputs);
const client = generateClient({ authMode: "userPool" });

// Inline custom theme
const customTheme = {
  name: "sticky-notes-theme",
  tokens: {
    components: {
      button: {
        primary: {
          backgroundColor: { value: "#FFEB3B" }, // bright yellow
          color: { value: "#000000" },
          _hover: {
            backgroundColor: { value: "#FDD835" }, // darker yellow
          },
        },
      },
    },
    fonts: {
      default: {
        variable: { value: "'Patrick Hand', cursive" },
      },
    },
  },
};

export default function App() {
  const [notes, setNotes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    await Promise.all(
      notes.map(async (note) => {
        if (note.image) {
          const link = await getUrl({
            path: ({ identityId }) => `media/${identityId}/${note.image}`,
          });
          note.image = link.url;
        }
        return note;
      })
    );
    setNotes(notes);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);

    const { data: newNote } = await client.models.Note.create({
      name: form.get("name"),
      description: form.get("description"),
      image: form.get("image").name,
    });

    if (newNote.image) {
      await uploadData({
        path: ({ identityId }) => `media/${identityId}/${newNote.image}`,
        data: form.get("image"),
      }).result;
    }

    fetchNotes();
    event.target.reset();
    setModalOpen(false);
  }

  async function deleteNote({ id }) {
    await client.models.Note.delete({ id });
    fetchNotes();
  }

  return (
    <Authenticator variation="modal" theme={customTheme}>
      {({ signOut }) => (
        <main
          className="bg-yellow-100 sticky min-h-screen p-6 text-gray-800 font-sans relative"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          <Heading level={2} className="text-5xl text-center mb-6 font-bold">
            🗒️ Sticky Notes
          </Heading>

          {/* Notes Grid */}
          <Grid
            className="gap-6 justify-center"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}
          >
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-yellow-200 p-4 rounded-lg shadow-md transform hover:rotate-1 hover:scale-105 transition duration-300 ease-in-out"
              >
                <Heading level={3} className="mb-2 text-xl font-bold">
                  📝 {note.name}
                </Heading>
                <Text className="mb-2 italic">{note.description}</Text>
                {note.image && (
                  <Image
                    src={note.image}
                    alt={note.name}
                    className="rounded w-full mb-2"
                  />
                )}
                <Button
                  onClick={() => deleteNote(note)}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  ❌ Delete
                </Button>
              </div>
            ))}
          </Grid>

          {/* Floating + Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="fixed bottom-6 right-6 bg-yellow-400 hover:bg-yellow-500 text-white text-4xl rounded-full h-16 w-16 shadow-lg flex items-center justify-center transition duration-300"
          >
            ➕
          </button>

          {/* Modal */}
          {modalOpen && (
            <>
              <div
                className="fixed background inset-0 bg-opacity-40 z-40"
                onClick={() => setModalOpen(false)}
              ></div>
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-yellow-50 p-6 rounded-lg shadow-xl w-[90%] max-w-lg">
                  <Heading level={3} className="mb-4 text-center">
                    ✨ Create a New Note
                  </Heading>
                  <View as="form" onSubmit={createNote}>
                    <TextField
                      name="name"
                      placeholder="Note Title"
                      label="Note Title"
                      variation="quiet"
                      required
                      className="mb-4"
                    />
                    <TextField
                      name="description"
                      placeholder="Note Description"
                      label="Note Description"
                      variation="quiet"
                      required
                      className="mb-4"
                    />
                    <input
                      name="image"
                      type="file"
                      accept="image/*"
                      className="mb-4"
                    />
                    <Flex justifyContent="space-between">
                      <Button
                        type="submit"
                        className="bg-yellow-400 hover:bg-yellow-500 text-white"
                      >
                        ➕ Create Note
                      </Button>
                      <Button
                        onClick={() => setModalOpen(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white"
                      >
                        ❎ Cancel
                      </Button>
                    </Flex>
                  </View>
                </div>
              </div>
            </>
          )}

          {/* Sign out */}
          <Flex justifyContent="center" className="mt-10">
            <Button
              onClick={signOut}
              className="bg-gray-800 signout text-white hover:bg-gray-700"
            >
              🚪 Sign Out
            </Button>
          </Flex>
        </main>
      )}
    </Authenticator>
  );
}
